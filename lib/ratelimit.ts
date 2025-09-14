/** @format */

// lib/ratelimit.ts
// Edge-friendly Upstash rate limiting utilities with tiered limits.

import { Ratelimit, type Duration } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { NextRequest } from "next/server";
import { plans, type TierId } from "./plans";
import { verifyHint, type VerifiedHint } from "./hint";

export type RateCategory =
    | "generations"
    | "partyUpdates"
    | "avatarUploads"
    | "api";

export interface LimitSpec {
    limit: number;
    window: Duration; // e.g. "1 h", "30 m"
}

export type RateLimits = Record<TierId, Record<RateCategory, LimitSpec>>;

function buildRateLimitsFromPlans(): RateLimits {
    const out: Partial<Record<TierId, Record<RateCategory, LimitSpec>>> = {};
    for (const plan of plans) {
        const limits = plan.rateLimits;
        if (!limits) continue;
        out[plan.id] = {
            generations: limits.generations,
            partyUpdates: limits.partyUpdates,
            avatarUploads: limits.avatarUploads,
            api: limits.api,
        } as Record<RateCategory, LimitSpec>;
    }
    // Fallback: if any tier missing, try mirroring free
    const free = out["free"];
    for (const tier of ["free", "basic", "plus", "pro"] as const) {
        if (!out[tier] && free) out[tier] = free;
    }
    return out as RateLimits;
}

const rateLimits: RateLimits = buildRateLimitsFromPlans();

// Create a single Redis client (Edge-compatible fetch-based client)
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Cache Ratelimit instances by category+tier for minimal overhead.
const limiterCache = new Map<string, Ratelimit>();

function getLimiter(category: RateCategory, tier: TierId): Ratelimit {
    const key = `${category}:${tier}`;
    const existing = limiterCache.get(key);
    if (existing) return existing;

    const spec = rateLimits[tier][category];
    const limiter = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(spec.limit, spec.window),
        analytics: false,
        prefix: `vv:${category}:${tier}`,
    });
    limiterCache.set(key, limiter);
    return limiter;
}

export function normalizeTier(input?: string | null): TierId {
    const v = (input || "").toLowerCase();
    switch (v) {
        case "basic":
        case "premium":
            return "basic";
        case "plus":
            return "plus";
        case "pro":
            return "pro";
        default:
            return "free";
    }
}

export function isKnownTier(v: string): v is TierId {
    return v === "free" || v === "basic" || v === "plus" || v === "pro";
}

export function resolveTierFromPlans(name?: string | null): TierId {
    const tier = normalizeTier(name);
    // Ensure it matches a declared plan id for forward-compat
    const allPlanIds = new Set(plans.map((p) => p.id));
    return allPlanIds.has(tier) ? tier : "free";
}

export function getClientIp(req: NextRequest): string | null {
    // Respect common proxy headers for edge
    const hdr = req.headers;
    const xForwardedFor = hdr.get("x-forwarded-for");
    if (xForwardedFor) {
        const first = xForwardedFor.split(",")[0]?.trim();
        if (first) return first;
    }
    return hdr.get("x-real-ip") || null;
}

async function getVerifiedHintFromRequest(
    req: NextRequest
): Promise<VerifiedHint | null> {
    try {
        const raw = req.cookies.get("vv_hint")?.value;
        const secret = process.env.VV_COOKIE_SECRET;
        if (!raw || !secret) return null;
        return await verifyHint(raw, secret);
    } catch {
        return null;
    }
}

export async function getUserIdFromHeaders(
    req: NextRequest
): Promise<string | null> {
    // Only trust signed cookie; remove legacy fallbacks
    const hint = await getVerifiedHintFromRequest(req);
    return hint?.uid ?? null;
}

export async function getTierFromHeaders(req: NextRequest): Promise<TierId> {
    // Only trust signed cookie; otherwise default to free
    const hint = await getVerifiedHintFromRequest(req);
    if (hint?.tier) return resolveTierFromPlans(hint.tier);
    return "free";
}

export type Classification = {
    category: RateCategory | null;
};

export function classifyPath(req: NextRequest): Classification {
    const { pathname } = req.nextUrl;
    const isPost = req.method.toUpperCase() === "POST";

    // Only limit (app) group as per request
    if (!pathname.startsWith("/app/")) {
        return { category: null };
    }

    // Generators (POSTs)
    if (
        isPost &&
        (pathname.includes("spellbook-generator") ||
            pathname.includes("world-generator") ||
            pathname.includes("encounter-generator") ||
            pathname.includes("battle-map-generator") ||
            pathname.includes("star-system-generator") ||
            pathname.includes("galaxy-generator") ||
            pathname.includes("magic-shop-generator"))
    ) {
        return { category: "generations" };
    }

    // Avatar uploads (POSTs under account actions)
    if (isPost && pathname.includes("/app/account")) {
        return { category: "avatarUploads" };
    }

    // Party updates (POSTs under parties)
    if (isPost && pathname.includes("/app/parties")) {
        return { category: "partyUpdates" };
    }

    // Generic API under (app) if present
    if (pathname.startsWith("/api/")) {
        return { category: "api" };
    }

    return { category: null };
}

export async function enforceRateLimit(req: NextRequest): Promise<
    | {
          ok: true;
          headers: Record<string, string>;
      }
    | {
          ok: false;
          status: number;
          headers: Record<string, string>;
          body: { error: string };
      }
> {
    const { category } = classifyPath(req);
    if (!category) {
        return { ok: true, headers: {} };
    }

    const tier = await getTierFromHeaders(req);
    const userId = await getUserIdFromHeaders(req);
    const ip = getClientIp(req);
    const identifier = userId ? `${userId}:${ip || "noip"}` : ip || "anonymous";

    const limiter = getLimiter(category, tier);
    const { success, limit, reset, remaining } = await limiter.limit(
        identifier
    );

    const headers: Record<string, string> = {
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": String(Math.max(0, remaining)),
        "X-RateLimit-Reset": String(reset),
        "X-RateLimit-Tier": tier,
        "X-RateLimit-Category": category,
    };

    if (success) {
        return { ok: true, headers };
    }

    const retryAfterSeconds = Math.max(
        0,
        Math.ceil((reset - Date.now()) / 1000)
    );
    headers["Retry-After"] = String(retryAfterSeconds);

    return {
        ok: false,
        status: 429,
        headers,
        body: {
            error: "Rate limit exceeded. Please try again later.",
        },
    };
}
