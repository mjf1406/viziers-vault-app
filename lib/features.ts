/** @format */

// data/siteCatalog.ts
// Single source of truth for pricing, features, and marketing surfaces

export type TierId = "free" | "premium" | "beta" | "alpha";

export interface Feature {
    id: string;
    title: string;
    description?: string;
    icon?: string; // lucide-react icon name, e.g., "Clock", "Shield", etc.
    minTier: TierId; // earliest tier that includes this feature
    tags?: string[];
    marketing?: boolean; // if true, can be picked for Benefits tiles
}

export type PlanBullet =
    | { type: "feature"; featureId: string; labelOverride?: string }
    | { type: "text"; label: string };

export interface Plan {
    id: TierId;
    title: string;
    priceMonthly: number;
    description: string;
    ctaText: string;
    ctaHref: string;
    popular?: boolean; // used for visual emphasis and footnotes
    footnote?: string; // e.g., "No credit card required"
    bullets: PlanBullet[];
}

export interface Catalog {
    tierOrder: TierId[];
    features: Record<string, Feature>;
    plans: Plan[];
    marketing: {
        // curated lists for the two homepage sections
        benefitTileFeatureIds: string[];
        serviceCardFeatureIds: string[];
    };
}

export const catalog: Catalog = {
    tierOrder: ["free", "premium", "beta", "alpha"],

    features: {
        // Free plan bullets
        "premade-worlds-only": {
            id: "premade-worlds-only",
            title: "Premade worlds & cities only",
            minTier: "free",
            tags: ["content", "worlds"],
        },
        "csv-export-only": {
            id: "csv-export-only",
            title: "CSV export only",
            minTier: "free",
            tags: ["export"],
        },
        "vtt-export": {
            id: "vtt-export",
            title: "VTT export",
            minTier: "free",
            tags: ["export", "maps"],
        },
        "image-export": {
            id: "image-export",
            title: "Image export",
            minTier: "free",
            tags: ["export"],
        },
        "community-support": {
            id: "community-support",
            title: "Community support on Discord",
            minTier: "free",
            tags: ["community"],
        },

        // Premium+ bullets
        "all-generators": {
            id: "all-generators",
            title: "All generators (current and future)",
            minTier: "premium",
            tags: ["access"],
        },
        "custom-worlds": {
            id: "custom-worlds",
            title: "Create custom worlds and cities",
            minTier: "premium",
            tags: ["worlds", "builder"],
        },
        permalink: {
            id: "permalink",
            title: "Permalink generation",
            minTier: "premium",
            tags: ["share"],
        },
        "data-persistence": {
            id: "data-persistence",
            title: "Data persistence and export",
            minTier: "premium",
            tags: ["cloud", "export"],
        },

        // Beta/Alpha bullets
        "beta-features": {
            id: "beta-features",
            title: "Access to Beta features",
            minTier: "beta",
            tags: ["early-access"],
        },
        "alpha-features": {
            id: "alpha-features",
            title: "Access to Alpha features",
            minTier: "alpha",
            tags: ["early-access"],
        },
        "feature-voting": {
            id: "feature-voting",
            title: "Voting Power",
            description: "Vote on new features and improvements on Discord.",
            minTier: "alpha",
            tags: ["community", "governance"],
        },

        // Benefits tiles (marketing highlights)
        "save-prep-time": {
            id: "save-prep-time",
            title: "Save Preparation Time",
            description:
                "Generate balanced encounters, magic shops, and spellbooks in minutes instead of hours of manual preparation.",
            icon: "Clock",
            minTier: "free",
            marketing: true,
            tags: ["marketing"],
        },
        "balanced-content": {
            id: "balanced-content",
            title: "Balanced Content",
            description:
                "All generated content is automatically balanced for your party's level and composition using D&D 5e 2024 guidelines.",
            icon: "Shield",
            minTier: "free",
            marketing: true,
            tags: ["marketing"],
        },
        "seamless-ux": {
            id: "seamless-ux",
            title: "Seamless UX",
            description:
                "Instant updates on your end with seamless server sync.",
            icon: "Database",
            minTier: "free",
            marketing: true,
            tags: ["marketing"],
        },
        "customizable-settings": {
            id: "customizable-settings",
            title: "Customizable Settings",
            description:
                "Fine-tune generation parameters to match your campaign's tone, difficulty, and world-building requirements.",
            icon: "Settings",
            minTier: "premium",
            marketing: true,
            tags: ["settings"],
        },

        // Services cards (capabilities)
        "access-anywhere": {
            id: "access-anywhere",
            title: "Access Anywhere",
            description:
                "All of your generated content and settings are saved in the cloud for use on any computer.",
            minTier: "premium",
            tags: ["cloud"],
        },
        "export-integration": {
            id: "export-integration",
            title: "Export & Integration",
            description:
                "Export generated content as CSV files. Link to D&D Beyond, Open 5e, or custom sources for easy reference.",
            minTier: "free",
            tags: ["export", "integration"],
        },
        "party-balance": {
            id: "party-balance",
            title: "Party Balance Integration",
            description:
                "Generate encounters automatically balanced for your party's composition and levels.",
            minTier: "free",
            tags: ["encounters"],
        },
        "vtt-compatibility": {
            id: "vtt-compatibility",
            title: "VTT Compatibility",
            description:
                "Export battle maps in formats compatible with popular virtual tabletops.",
            minTier: "free",
            tags: ["maps", "export"],
        },
    },

    plans: [
        {
            id: "free",
            title: "Free",
            priceMonthly: 0,
            description:
                "Basic access to core generators with limited features and no data persistence.",
            ctaText: "Start Using Free",
            ctaHref: "/app/account",
            bullets: [
                { type: "feature", featureId: "premade-worlds-only" },
                { type: "feature", featureId: "csv-export-only" },
                { type: "feature", featureId: "vtt-export" },
                { type: "feature", featureId: "image-export" },
                { type: "feature", featureId: "community-support" },
            ],
        },
        {
            id: "premium",
            title: "Premium",
            priceMonthly: 3,
            description:
                "Full access to all features with data persistence and advanced capabilities.",
            ctaText: "Start 4-month free Trial",
            ctaHref: "/app/account",
            popular: true,
            footnote: "No credit card required",
            bullets: [
                { type: "text", label: "Everything in Free, plus:" },
                { type: "feature", featureId: "all-generators" },
                { type: "feature", featureId: "custom-worlds" },
                { type: "feature", featureId: "permalink" },
                { type: "feature", featureId: "data-persistence" },
                { type: "text", label: "Free 4-month trial included" },
            ],
        },
        {
            id: "beta",
            title: "Beta Access",
            priceMonthly: 5,
            description:
                "Full access to all features with data persistence and advanced capabilities.",
            ctaText: "Subscribe to Beta",
            ctaHref: "/app/account",
            bullets: [
                { type: "text", label: "Everything in Premium, plus:" },
                { type: "feature", featureId: "beta-features" },
            ],
        },
        {
            id: "alpha",
            title: "Alpha Access",
            priceMonthly: 10,
            description:
                "Full access to all features with data persistence and advanced capabilities.",
            ctaText: "Subscribe to Alpha",
            ctaHref: "/app/account",
            bullets: [
                { type: "text", label: "Everything in Beta Access, plus:" },
                { type: "feature", featureId: "alpha-features" },
                { type: "feature", featureId: "feature-voting" },
            ],
        },
    ],

    marketing: {
        benefitTileFeatureIds: [
            "save-prep-time",
            "balanced-content",
            "seamless-ux",
            "customizable-settings",
        ],
        serviceCardFeatureIds: [
            "customizable-settings", // same feature used for "Fully Customizable"
            "access-anywhere",
            "feature-voting",
            "export-integration",
            "party-balance",
            "vtt-compatibility",
        ],
    },
};
