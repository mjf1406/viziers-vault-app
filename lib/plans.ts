/** @format */

// lib/plans.ts

export type TierId = "free" | "basic" | "plus" | "pro";

export interface Plan {
    id: TierId;
    title: string;
    priceMonthly: number;
    description: string;
    ctaText: string;
    ctaHref: string;
    popular?: boolean; // used for visual emphasis and footnotes
    footnote?: string; // e.g., "No credit card required"
    rateLimits?: {
        generations: {
            limit: number;
            window: import("@upstash/ratelimit").Duration;
        };
        partyUpdates: {
            limit: number;
            window: import("@upstash/ratelimit").Duration;
        };
        avatarUploads: {
            limit: number;
            window: import("@upstash/ratelimit").Duration;
        };
        api: { limit: number; window: import("@upstash/ratelimit").Duration };
    };
}

export const plans: Plan[] = [
    {
        id: "free",
        title: "Free",
        priceMonthly: 0,
        description:
            "Basic access to core generators with limited features and no data persistence.",
        ctaText: "Start Using Free",
        ctaHref: "/app/account",
        rateLimits: {
            generations: { limit: 6, window: "5 m" },
            partyUpdates: { limit: 0, window: "5 m" },
            avatarUploads: { limit: 1, window: "30 m" },
            api: { limit: 6, window: "5 m" },
        },
    },
    {
        id: "basic",
        title: "Basic",
        priceMonthly: 3,
        description:
            "Full access to all features with data persistence and advanced capabilities.",
        ctaText: "Start 4-month free Trial",
        ctaHref: "/app/account",
        popular: true,
        footnote: "No credit card required",
        rateLimits: {
            generations: { limit: 12, window: "5 m" },
            partyUpdates: { limit: 2, window: "5 m" },
            avatarUploads: { limit: 2, window: "30 m" },
            api: { limit: 12, window: "5 m" },
        },
    },
    {
        id: "plus",
        title: "Plus",
        priceMonthly: 5,
        description:
            "Full access to all features with data persistence and advanced capabilities.",
        ctaText: "Subscribe to Plus",
        ctaHref: "/app/account",
        rateLimits: {
            generations: { limit: 18, window: "5 m" },
            partyUpdates: { limit: 4, window: "5 m" },
            avatarUploads: { limit: 3, window: "30 m" },
            api: { limit: 18, window: "5 m" },
        },
    },
    {
        id: "pro",
        title: "Pro",
        priceMonthly: 10,
        description:
            "Full access to all features with data persistence and advanced capabilities.",
        ctaText: "Subscribe to Pro",
        ctaHref: "/app/account",
        rateLimits: {
            generations: { limit: 24, window: "5 m" },
            partyUpdates: { limit: 6, window: "5 m" },
            avatarUploads: { limit: 5, window: "30 m" },
            api: { limit: 24, window: "5 m" },
        },
    },
];
