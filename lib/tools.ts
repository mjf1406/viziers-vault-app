/** @format */

export interface Tool {
    id: string;
    title: string;
    description: string;
    status:
        | "Alpha 1"
        | "Alpha 2"
        | "Alpha 3"
        | "Alpha 4"
        | "Planned"
        | "TBD - A wild dream";
    icon: string;
    philosophy: string;
    features: string[];
    connections: string[];
    category: "Generator" | "Management";
    order: number;
    url: string;
}

export const tools: Tool[] = [
    {
        id: "magic-shop-generator",
        title: "Magic Shop Generator",
        description:
            "Generate magic shops based on city population, wealth, and magic level.",
        status: "Alpha 1",
        icon: "Store",
        philosophy:
            "I love to run roguelite D&D campaigns, where everything is randomly generated. This started just for basic magic items, but quickly expanded to everything that can be purchased in D&D 5e due to a player buying just a few too many spell components and completely wrecking the world. You remember this, don't you, Juno?",
        features: [
            "Population-based inventory",
            "Wealth and magic level scaling",
            "Custom world and city creation",
            "CSV export",
            "Permalink generation (Premium)",
            "Data persistence (Premium)",
        ],
        connections: ["World Generator"],
        category: "Generator",
        order: 1,
        url: "https://app.viziersvault.com/magic-shop-generator",
    },
    {
        id: "spellbook-generator",
        title: "Spellbook Generator",
        description:
            "Create wizard spellbooks by selecting level, schools of magic, and probability settings.",
        status: "Alpha 1",
        icon: "BookOpen",
        philosophy:
            "One of my players was playing a wizard and was always asking about any spellbooks that they find when looting. They only started finding spellbooks once I made this generator. These are meant to be used as lootable items for wizards to find so they can learn even more spells!",
        features: [
            "Level-based spell selection",
            "School of magic filtering",
            "Probability-based extra spells",
            "Wizard progression examples",
            "Educational tool for new players",
        ],
        connections: [],
        category: "Generator",
        order: 2,
        url: "https://app.viziersvault.com/spellbook-generator",
    },
    {
        id: "encounter-generator",
        title: "Encounter Generator",
        description:
            "Generate balanced encounters based on party composition, biome, and travel conditions.",
        status: "Alpha 2",
        icon: "Swords",
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
        connections: ["Party Management", "Battle Map Generator"],
        category: "Generator",
        order: 3,
        url: "https://app.viziersvault.com/encounter-generator",
    },
    {
        id: "party-management",
        title: "Party Management",
        description:
            "Manage party composition, balance, and progress tracking.",
        status: "Alpha 2",
        icon: "Users",
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
        connections: ["Encounter Generator", "World Generator"],
        category: "Management",
        order: 4,
        url: "https://app.viziersvault.com/parties",
    },
    {
        id: "battle-map-generator",
        title: "Battle Map Generator",
        description:
            "Create battle maps with geographical features, weather, and customizable grid settings.",
        status: "Alpha 3",
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
        connections: ["Encounter Generator"],
        category: "Generator",
        order: 5,
        url: "https://app.viziersvault.com/battle-map-generator",
    },
    {
        id: "world-generator",
        title: "World Generator",
        description:
            "Generate complete hex worlds with weather simulation, fog of war, and party tracking.",
        status: "Alpha 4",
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
        connections: [
            "Battle Map Generator",
            "Encounter Generator",
            "Magic Shop Generator",
            "Party Management",
        ],
        category: "Generator",
        order: 6,
        url: "https://app.viziersvault.com/world-generator",
    },
    {
        id: "star-system-generator",
        title: "Star System Generator",
        description:
            "Create star systems with multiple worlds, planets, and celestial bodies.",
        status: "TBD - A wild dream",
        icon: "Star",
        philosophy:
            "I haven't really thought much of this one other than it'd be super cool for those Spelljammer and sci-fi campaigns.",
        features: [
            "Multiple planets per system",
            "Celestial body generation",
            "Orbital mechanics",
            "System-wide exploration",
        ],
        connections: ["World Generator"],
        category: "Generator",
        order: 7,
        url: "https://app.viziersvault.com/star-system-generator",
    },
    {
        id: "galaxy-generator",
        title: "Galaxy Generator",
        description:
            "Generate entire galaxies with multiple star systems and cosmic structures.",
        status: "TBD - A wild dream",
        icon: "Orbit",
        philosophy:
            "I just think it'd be super cool to make this with an awesome map that has a sort of super zoom from the galaxy to the star system to the planet to the continent to the region to the battle map / city / town / etc. Oh and Spelljammer and sci-fi campaigns in something like that would be dope.",
        features: [
            "Multiple star systems per galaxy",
            "Cosmic structure generation",
            "Galaxy-wide exploration",
            "Interstellar travel mechanics",
        ],
        connections: ["Star System Generator"],
        category: "Generator",
        order: 8,
        url: "https://app.viziersvault.com/galaxy-generator",
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
