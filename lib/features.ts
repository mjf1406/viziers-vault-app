/** @format */

// lib/features.ts

import { TierId } from "./plans";

export interface Feature {
    id: string; // moved from object key to property
    title: string;
    description?: string;
    icon?: string; // lucide-react icon name, e.g., "Clock", "Shield", etc.
    minTier: TierId; // earliest tier that includes this feature
    tags?: string[];
    service?: Boolean;
}

export const features: Feature[] = [
    {
        id: "customizable-settings",
        title: "Customizable Settings",
        description:
            "Adjust nearly everything related to generation across all tools.",
        minTier: "basic",
        tags: ["settings", "customization"],
        service: true,
    },
    {
        id: "data-persistence",
        title: "Data Persistence",
        description: "Keep your data safe and export it whenever you need.",
        minTier: "basic",
        tags: ["cloud", "export"],
        service: false,
    },
    // {
    //     id: "voting-power",
    //     title: "Voting Power",
    //     description:
    //         "Influence the direction of the project with your votes on Discord.",
    //     minTier: "pro",
    //     tags: ["community", "participation"],
    //     service: false,
    // },
    {
        id: "permalinks",
        title: "Permalink Generation",
        description: "Create shareable links to your generated content.",
        minTier: "basic",
        tags: ["share"],
        service: false,
    },
    {
        id: "image-export",
        title: "Image Export",
        description: "Export generated maps as images.",
        minTier: "free",
        tags: ["export"],
        service: false,
    },
    // {
    //     id: "alpha-access",
    //     title: "Alpha Access",
    //     description: "Get access to alpha features.",
    //     minTier: "pro",
    //     tags: ["access"],
    //     service: false,
    // },
    // {
    //     id: "beta-access",
    //     title: "Beta Access",
    //     description: "Get access to beta features.",
    //     minTier: "plus",
    //     tags: ["access"],
    //     service: false,
    // },
    {
        id: "csv-export",
        title: "CSV Export",
        description: "Export generations as CSV files.",
        minTier: "free",
        tags: ["export"],
        service: false,
    },
    {
        id: "vtt-export",
        title: "VTT Export",
        description: "Export generated maps as VTT files where possible.",
        minTier: "free",
        tags: ["export", "maps"],
        service: false,
    },
    {
        id: "community-support",
        title: "Community support on Discord",
        minTier: "free",
        tags: ["community"],
        service: false,
    },
    {
        id: "custom-worlds-and-cities",
        title: "Custom Worlds and Cities",
        description:
            "Create and customize your own worlds and cities for use in the Magic Shop Generator, World Generator, and Encounter Generator.",
        minTier: "basic",
        tags: ["worlds", "builder"],
        service: false,
    },
];
