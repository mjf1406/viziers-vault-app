/** @format */

export interface Tool {
    id: string;
    title: string;
    header: string;
    description: string;
    status:
        | "Alpha 1"
        | "Alpha 2"
        | "Alpha 3"
        | "Alpha 4"
        | "Alpha 5"
        | "Alpha 6"
        | "Alpha 7"
        | "Planned"
        | "TBD - A wild dream";
    icon: string;
    released?: "new" | "yes";
    philosophy: string;
    features: string[];
    integrations: string[];
    category: "Generator" | "Management";
    order: number;
    url: string;
    // Mock data for dashboard
    mockCount?: number;
    mockRecentGenerations?: Array<{
        id: number;
        title: string;
        generatedAt: string;
        lastAccessedAt: string;
    }>;
}

export const tools: Tool[] = [
    {
        id: "magic-shop-generator",
        title: "Magic Shop Generator",
        header: "My Magic Shops",
        description:
            "Generate magic shops based on city population, wealth, and magicness.",
        status: "Alpha 1",
        icon: "Store",
        released: "new",
        philosophy:
            "I love to run roguelite D&D campaigns, where everything is randomly generated. This started just for basic magic items, but quickly expanded to everything that can be purchased in D&D 5e due to a player buying just a few too many spell components and completely wrecking the world. You remember this, don't you, Juno?",
        features: [
            "Population-based inventory",
            "Wealth and magicness scaling",
            "Custom world and city creation",
            "CSV export",
            "Permalink generation (Premium)",
            "Data persistence (Premium)",
        ],
        integrations: ["World Generator"],
        category: "Generator",
        order: 1,
        url: "/app/magic-shop-generator",
        mockCount: 7,
        mockRecentGenerations: [
            {
                id: 5,
                title: "Enchanted Emporium",
                generatedAt: "2024-01-11T09:30:00Z",
                lastAccessedAt: "2024-01-12T12:20:00Z",
            },
            {
                id: 22,
                title: "Potion Master's",
                generatedAt: "2024-01-10T14:20:00Z",
                lastAccessedAt: "2024-01-11T17:45:00Z",
            },
            {
                id: 23,
                title: "Scroll Scribe",
                generatedAt: "2024-01-09T11:15:00Z",
                lastAccessedAt: "2024-01-10T13:30:00Z",
            },
            {
                id: 24,
                title: "Wand Workshop",
                generatedAt: "2024-01-08T16:40:00Z",
                lastAccessedAt: "2024-01-09T10:25:00Z",
            },
            {
                id: 25,
                title: "Artifact Dealer",
                generatedAt: "2024-01-07T13:50:00Z",
                lastAccessedAt: "2024-01-08T15:10:00Z",
            },
        ],
    },
    {
        id: "spellbook-generator",
        title: "Spellbook Generator",
        header: "My Spellbooks",
        description:
            "Create wizard spellbooks by selecting level, schools of magic, and probability settings.",
        status: "Alpha 1",
        icon: "BookOpen",
        released: "new",
        philosophy:
            "One of my players was playing a wizard and was always asking about any spellbooks that they find when looting. They only started finding spellbooks once I made this generator. These are meant to be used as lootable items for wizards to find so they can learn even more spells!",
        features: [
            "Level-based spell selection",
            "School of magic filtering",
            "Probability-based extra spells",
            "Wizard progression examples",
            "Educational tool for new players",
        ],
        integrations: [],
        category: "Generator",
        order: 2,
        url: "/app/spellbook-generator",
        mockCount: 5,
        mockRecentGenerations: [
            {
                id: 3,
                title: "Arcane Tome",
                generatedAt: "2024-01-13T11:20:00Z",
                lastAccessedAt: "2024-01-14T18:30:00Z",
            },
            {
                id: 14,
                title: "Necromancer's Grimoire",
                generatedAt: "2024-01-12T13:45:00Z",
                lastAccessedAt: "2024-01-13T20:15:00Z",
            },
            {
                id: 15,
                title: "Healer's Manual",
                generatedAt: "2024-01-11T16:30:00Z",
                lastAccessedAt: "2024-01-12T11:40:00Z",
            },
            {
                id: 16,
                title: "Elemental Spells",
                generatedAt: "2024-01-10T09:20:00Z",
                lastAccessedAt: "2024-01-11T14:50:00Z",
            },
            {
                id: 17,
                title: "Divine Prayers",
                generatedAt: "2024-01-09T14:15:00Z",
                lastAccessedAt: "2024-01-10T12:30:00Z",
            },
        ],
    },
    {
        id: "encounter-generator",
        title: "Encounter Generator",
        header: "My Encounters",
        description:
            "Generate balanced encounters based on party composition, biome, and travel conditions.",
        status: "Alpha 2",
        icon: "Swords",
        released: "new",
        philosophy:
            "A roguelite D&D campaign is not complete without random encounters of the combat, non-combat, and hazard variety! I love doing hexcrawls and random encounters in each hex or every hour of travel time because it's a wonderfully fun challenge for me to use the randomly rolled encounter, then improvise a way to connect it to the party's story or a PC's story in a coherent way. I LOVE improv GMing!",
        features: [
            "Party composition balancing",
            "Biome-specific encounters",
            "Travel condition integration",
            "Season and time of day effects",
            "Multiple encounter generation",
            "Environmental storytelling",
        ],
        integrations: ["Party Management", "Battle Map Generator"],
        category: "Generator",
        order: 3,
        url: "/app/encounter-generator",
        mockCount: 8,
        mockRecentGenerations: [
            {
                id: 2,
                title: "Goblin Ambush",
                generatedAt: "2024-01-14T16:45:00Z",
                lastAccessedAt: "2024-01-15T09:15:00Z",
            },
            {
                id: 10,
                title: "Bandit Raid",
                generatedAt: "2024-01-13T12:30:00Z",
                lastAccessedAt: "2024-01-14T10:20:00Z",
            },
            {
                id: 11,
                title: "Dragon Attack",
                generatedAt: "2024-01-12T15:20:00Z",
                lastAccessedAt: "2024-01-13T08:45:00Z",
            },
            {
                id: 12,
                title: "Undead Horde",
                generatedAt: "2024-01-11T18:10:00Z",
                lastAccessedAt: "2024-01-12T14:30:00Z",
            },
            {
                id: 13,
                title: "Merchant Ambush",
                generatedAt: "2024-01-10T10:45:00Z",
                lastAccessedAt: "2024-01-11T16:20:00Z",
            },
        ],
    },
    {
        id: "party-management",
        title: "Party Management",
        header: "My Parties",
        description:
            "Manage party composition, balance, and progress tracking.",
        status: "Alpha 2",
        icon: "Users",
        released: "new",
        philosophy:
            "This is only here because I wanted to be able to generate balanced encounters and to track multiple parties on the same world.",
        features: [
            "Party composition tracking",
            "Level and character management",
            "Balance calculations",
            "Circular icon customization",
            "World view integration",
            "Encounter balancing",
        ],
        integrations: [],
        category: "Management",
        order: 4,
        url: "/app/parties",
        mockCount: 0,
        mockRecentGenerations: [],
    },
    {
        id: "battle-map-generator",
        title: "Battle Map Generator",
        header: "My Battle Maps",
        description:
            "Create battle maps with geographical features, weather, and customizable grid settings.",
        status: "Alpha 4",
        icon: "Map",
        philosophy:
            "I really enjoy making battle maps for bosses or mini-bosses and I love Czepeku, Animated Battle Maps, Crossland, Neutral Party, and Eightfold Paper maps, but I do not enjoy making wilderness battle maps meant to be used for random encounters that happened in some random middle of nowhere wilderness during a campaign. I made this generator to generate random encounter wilderness battle maps. They do not replace boss or mini-boss battle maps in my campaign and it was never built with that intention.",
        features: [
            "Geographical feature generation",
            "Weather and lighting effects",
            "Customizable grid settings",
            "TV screen formatting",
            "Paint and stamp tools",
            "VTT export compatibility",
            "Automatic encounter mapping",
        ],
        integrations: [],
        category: "Generator",
        order: 6,
        url: "/app/battle-map-generator",
        mockCount: 12,
        mockRecentGenerations: [
            {
                id: 1,
                title: "Ancient Ruins",
                generatedAt: "2024-01-15T10:30:00Z",
                lastAccessedAt: "2024-01-15T14:20:00Z",
            },
            {
                id: 6,
                title: "Dragon's Lair",
                generatedAt: "2024-01-14T08:15:00Z",
                lastAccessedAt: "2024-01-14T16:30:00Z",
            },
            {
                id: 7,
                title: "Forest Clearing",
                generatedAt: "2024-01-13T14:20:00Z",
                lastAccessedAt: "2024-01-13T19:45:00Z",
            },
            {
                id: 8,
                title: "Underground Cavern",
                generatedAt: "2024-01-12T11:30:00Z",
                lastAccessedAt: "2024-01-12T17:20:00Z",
            },
            {
                id: 9,
                title: "Castle Courtyard",
                generatedAt: "2024-01-11T09:45:00Z",
                lastAccessedAt: "2024-01-11T15:10:00Z",
            },
        ],
    },
    {
        id: "region-generator",
        title: "Region Generator",
        header: "My Regions",
        description:
            "Generate smaller hexcrawl regions, like islands, peninsulas, bays, inland areas, and coastal regions.",
        status: "Alpha 3",
        icon: "MapPinned",
        philosophy:
            "I wanted a focused tool for compact hexcrawls that sit between a single encounter map and a full world hexmap. This produces playable regions that are easy to drop into campaigns, adventure hooks, and quick sandbox setups for session-length exploration.",
        features: [
            "Hex-scale region generation (coastal, island, inland, peninsula, bay)",
            "Terrain and biome tiling",
            "Settlement and POI placement with descriptions",
            "Local weather and tide influences for coastal regions",
            "Encounter hooks & short story seeds",
            "VTT export and CSV of hex data",
            "Adjustable density and scale (hex size / region size)",
        ],
        integrations: [
            "Battle Map Generator",
            "Encounter Generator",
            "Party Management",
        ],
        category: "Generator",
        order: 5,
        url: "/app/region-generator",
        mockCount: 4,
        mockRecentGenerations: [
            {
                id: 30,
                title: "Saltmarsh Archipelago",
                generatedAt: "2024-01-16T09:00:00Z",
                lastAccessedAt: "2024-01-16T11:20:00Z",
            },
            {
                id: 31,
                title: "Bracken Peninsular",
                generatedAt: "2024-01-15T14:10:00Z",
                lastAccessedAt: "2024-01-15T18:05:00Z",
            },
            {
                id: 32,
                title: "Glassbay Cove",
                generatedAt: "2024-01-14T10:25:00Z",
                lastAccessedAt: "2024-01-14T12:45:00Z",
            },
            {
                id: 33,
                title: "Highland Basin",
                generatedAt: "2024-01-13T08:40:00Z",
                lastAccessedAt: "2024-01-13T09:50:00Z",
            },
        ],
    },
    {
        id: "world-generator",
        title: "World Generator",
        header: "My Worlds",
        description:
            "Generate complete hex worlds with weather simulation, fog of war, and party tracking.",
        status: "Alpha 5",
        icon: "Globe",
        philosophy:
            "When I started brainstorming for this after creating the above generators, I discovered HexRoll, which is an AMAZING tool. Go give it a try now, please. It's fabulous. While it is fabulous, it doesn't work exactly how I run my hexcrawls and has some missing features, so I'm building this to generate entire worlds, both 2D and 3D with party tracking, simulated weather, detailed edit options with stamps and brushes and automatic rolls minimizing the friction as much as possible for game masters. Note that HexRoll has wonderful options for solo hexcrawlers and I do not intend on supporting solo hexcrawlers at all in the future, so if you're interested in playing on your own in a random hexworld, go use HexRoll. It's superb!",
        features: [
            "Hex-based world exploration",
            "Weather simulation",
            "Fog of war system",
            "Party tracking",
            "2D and 3D world views",
            "Automatic encounter generation",
        ],
        integrations: [
            "Battle Map Generator",
            "Encounter Generator",
            "Magic Shop Generator",
            "Party Management",
            "Region Generator",
        ],
        category: "Generator",
        order: 7,
        url: "/app/world-generator",
        mockCount: 3,
        mockRecentGenerations: [
            {
                id: 4,
                title: "Floating Islands",
                generatedAt: "2024-01-12T13:10:00Z",
                lastAccessedAt: "2024-01-13T15:45:00Z",
            },
            {
                id: 18,
                title: "Desert Kingdom",
                generatedAt: "2024-01-11T10:30:00Z",
                lastAccessedAt: "2024-01-12T13:20:00Z",
            },
            {
                id: 19,
                title: "Frozen Wasteland",
                generatedAt: "2024-01-10T15:45:00Z",
                lastAccessedAt: "2024-01-11T09:15:00Z",
            },
        ],
    },
    {
        id: "star-system-generator",
        title: "Star System Generator",
        header: "My Star Systems",
        description:
            "Create star systems with multiple worlds, planets, and celestial bodies.",
        status: "Alpha 6",
        icon: "Star",
        philosophy:
            "I haven't really thought much of this one other than it'd be super cool for those Spelljammer and sci-fi campaigns.",
        features: [
            "Multiple planets per system",
            "Celestial body generation",
            "Orbital mechanics",
            "System-wide exploration",
        ],
        integrations: ["World Generator"],
        category: "Generator",
        order: 7,
        url: "/app/star-system-generator",
        mockCount: 0,
        mockRecentGenerations: [],
    },
    {
        id: "galaxy-generator",
        title: "Galaxy Generator",
        header: "My Galaxies",
        description:
            "Generate entire galaxies with multiple star systems and cosmic structures.",
        status: "Alpha 7",
        icon: "Orbit",
        philosophy:
            "I just think it'd be super cool to make this with an awesome map that has a sort of super zoom from the galaxy to the star system to the planet to the continent to the region to the battle map / city / town / etc. Oh and Spelljammer and sci-fi campaigns in something like that would be dope.",
        features: [
            "Multiple star systems per galaxy",
            "Cosmic structure generation",
            "Galaxy-wide exploration",
            "Interstellar travel mechanics",
        ],
        integrations: ["Star System Generator"],
        category: "Generator",
        order: 8,
        url: "/app/galaxy-generator",
        mockCount: 2,
        mockRecentGenerations: [
            {
                id: 20,
                title: "Andromeda Sector",
                generatedAt: "2024-01-11T12:20:00Z",
                lastAccessedAt: "2024-01-12T16:30:00Z",
            },
            {
                id: 21,
                title: "Pleiades Cluster",
                generatedAt: "2024-01-10T08:45:00Z",
                lastAccessedAt: "2024-01-11T11:20:00Z",
            },
        ],
    },
];

// Helper functions
export const getToolById = (id: string): Tool | undefined => {
    return tools.find((tool) => tool.id === id);
};

export const getToolsByStatus = (status: Tool["status"]): Tool[] => {
    return tools.filter((tool) => tool.status === status);
};

export const getToolsByCategory = (category: Tool["category"]): Tool[] => {
    return tools.filter((tool) => tool.category === category);
};

export const getAvailableTools = (): Tool[] => {
    return tools.filter((tool) => tool.status !== "TBD - A wild dream");
};

export const getToolsInOrder = (): Tool[] => {
    return tools.sort((a, b) => a.order - b.order);
};

// New helper function to get tools with mock data for dashboard
export const getToolsWithMockData = (): Tool[] => {
    return getAvailableTools().filter((tool) => tool.mockCount !== undefined);
};
