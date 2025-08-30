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
    },
    {
        id: "plus",
        title: "Plus",
        priceMonthly: 5,
        description:
            "Full access to all features with data persistence and advanced capabilities.",
        ctaText: "Subscribe to Plus",
        ctaHref: "/app/account",
    },
    {
        id: "pro",
        title: "Pro",
        priceMonthly: 10,
        description:
            "Full access to all features with data persistence and advanced capabilities.",
        ctaText: "Subscribe to Pro",
        ctaHref: "/app/account",
    },
];
