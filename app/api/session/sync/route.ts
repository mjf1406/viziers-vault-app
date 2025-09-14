/** @format */

import { NextResponse } from "next/server";
import dbServer from "@/server/db-server";
import { resolveTierFromPlans } from "@/lib/ratelimit";
import { signHint } from "@/lib/hint";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    // Basic CSRF origin check
    const origin = (req.headers.get("origin") || "").toLowerCase();
    const referer = (req.headers.get("referer") || "").toLowerCase();
    const allowedOrigins = new Set([
        "http://localhost:3000",
        "https://viziersvault.com",
    ]);
    const originOk = [...allowedOrigins].some(
        (o) => origin === o || referer.startsWith(o)
    );
    if (!originOk) {
        return NextResponse.json(
            { ok: false, error: "Forbidden" },
            { status: 403 }
        );
    }

    const body = await req.json().catch(() => ({} as any));
    const userId = typeof body?.userId === "string" ? body.userId.trim() : "";

    if (!userId) {
        return NextResponse.json(
            { ok: false, error: "Missing userId" },
            { status: 400 }
        );
    }

    // Look up user's current plan on the server
    const q = {
        $users: { $: { where: { id: userId } }, profile: {} },
    };
    const users = await dbServer.query(q);
    const profilePlan = users?.$users?.[0]?.profile?.plan as string | undefined;
    const tier = resolveTierFromPlans(profilePlan);

    const res = NextResponse.json({ ok: true });
    const maxAge = 60 * 60 * 24 * 7; // 7 days

    // Legacy cleanup
    res.cookies.set("vv_uid", "", { httpOnly: true, path: "/", maxAge: 0 });
    res.cookies.set("vv_plan", "", { httpOnly: true, path: "/", maxAge: 0 });

    // Signed hint cookie
    const secret = process.env.VV_COOKIE_SECRET || "";
    const now = Date.now();
    const exp = now + 1000 * 60 * 60 * 24 * 3; // 3 days
    if (secret) {
        const token = await signHint(
            { uid: userId, tier, iat: now, exp },
            secret
        );
        res.cookies.set("vv_hint", token, {
            httpOnly: true,
            sameSite: "strict",
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge,
        });
    }

    return res;
}
