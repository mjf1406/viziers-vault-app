/** @format */

// Settlement helper enums (matches the choices you listed)
export const SETTLEMENT_WEALTH = [
    "wretched",
    "squalid",
    "poor",
    "modest",
    "comfortable",
    "wealthy",
    "aristocratic",
];

export const SETTLEMENT_MAGICNESS = [
    "negligible",
    "scarce",
    "rare",
    "sporadic",
    "common",
    "abundant",
    "widespread",
];

export const SHOP_TYPES = [
    "armor",
    "items",
    "poisons",
    "potions",
    "spell components",
    "scrolls",
    "weapons",
];

// Pre-made worlds + example settlements (fields match your i.entity schema)
export const PREMADE_WORLDS = [
    {
        id: "toril",
        name: "Toril",
        setting: "Forgotten Realms",
        settlements: [
            {
                name: "Waterdeep",
                population: 130000,
                wealth: "aristocratic",
                magicness: "widespread",
                shopTypes: [
                    "armor",
                    "items",
                    "poisons",
                    "potions",
                    "spell components",
                    "scrolls",
                    "weapons",
                ],
            },
            {
                name: "Baldur's Gate",
                population: 75000,
                wealth: "wealthy",
                magicness: "abundant",
                shopTypes: [
                    "items",
                    "potions",
                    "scrolls",
                    "spell components",
                    "weapons",
                ],
            },
            {
                name: "Neverwinter",
                population: 25000,
                wealth: "comfortable",
                magicness: "abundant",
                shopTypes: ["items", "potions", "scrolls", "weapons"],
            },
            {
                name: "Silverymoon",
                population: 12000,
                wealth: "comfortable",
                magicness: "widespread",
                shopTypes: ["items", "potions", "scrolls", "spell components"],
            },
            {
                name: "Suzail (Cormyr)",
                population: 60000,
                wealth: "aristocratic",
                magicness: "common",
                shopTypes: ["armor", "items", "potions", "scrolls", "weapons"],
            },
        ],
    },

    {
        id: "oerth",
        name: "Oerth",
        setting: "Greyhawk",
        settlements: [
            {
                name: "Greyhawk City",
                population: 40000,
                wealth: "comfortable",
                magicness: "common",
                shopTypes: [
                    "items",
                    "potions",
                    "scrolls",
                    "spell components",
                    "weapons",
                ],
            },
            {
                name: "Dyvers",
                population: 25000,
                wealth: "wealthy",
                magicness: "common",
                shopTypes: ["items", "potions", "scrolls", "weapons"],
            },
            {
                name: "Hardby",
                population: 2500,
                wealth: "modest",
                magicness: "sporadic",
                shopTypes: ["items", "weapons"],
            },
            {
                name: "Veluna",
                population: 8000,
                wealth: "modest",
                magicness: "sporadic",
                shopTypes: ["items", "potions"],
            },
        ],
    },

    {
        id: "krynn",
        name: "Krynn",
        setting: "Dragonlance",
        settlements: [
            {
                name: "Palanthas",
                population: 70000,
                wealth: "wealthy",
                magicness: "widespread",
                shopTypes: [
                    "armor",
                    "items",
                    "potions",
                    "scrolls",
                    "spell components",
                    "weapons",
                ],
            },
            {
                name: "Solace",
                population: 3000,
                wealth: "modest",
                magicness: "common",
                shopTypes: ["items", "potions"],
            },
            {
                name: "Qualinesti",
                population: 15000,
                wealth: "comfortable",
                magicness: "abundant",
                shopTypes: ["items", "scrolls", "spell components"],
            },
            {
                name: "Sanction",
                population: 9000,
                wealth: "poor",
                magicness: "rare",
                shopTypes: ["items", "weapons"],
            },
        ],
    },

    {
        id: "eberron",
        name: "Eberron",
        setting: "Eberron",
        settlements: [
            {
                name: "Sharn",
                population: 500000,
                wealth: "wealthy",
                magicness: "widespread",
                shopTypes: [
                    "armor",
                    "items",
                    "poisons",
                    "potions",
                    "spell components",
                    "scrolls",
                    "weapons",
                ],
            },
            {
                name: "Wroat",
                population: 65000,
                wealth: "wealthy",
                magicness: "abundant",
                shopTypes: [
                    "items",
                    "potions",
                    "scrolls",
                    "spell components",
                    "weapons",
                ],
            },
            {
                name: "Korranberg",
                population: 30000,
                wealth: "wealthy",
                magicness: "abundant",
                shopTypes: ["items", "scrolls", "spell components"],
            },
            {
                name: "Stormreach",
                population: 25000,
                wealth: "comfortable",
                magicness: "common",
                shopTypes: ["items", "potions", "weapons"],
            },
        ],
    },

    {
        id: "athas",
        name: "Athas",
        setting: "Dark Sun",
        settlements: [
            {
                name: "Tyr",
                population: 50000,
                wealth: "poor",
                magicness: "scarce",
                shopTypes: ["items", "weapons", "potions"],
            },
            {
                name: "Urik",
                population: 40000,
                wealth: "aristocratic",
                magicness: "rare",
                shopTypes: ["items", "weapons"],
            },
            {
                name: "Raam",
                population: 30000,
                wealth: "aristocratic",
                magicness: "rare",
                shopTypes: ["items", "weapons", "potions"],
            },
            {
                name: "Balic",
                population: 8000,
                wealth: "squalid",
                magicness: "scarce",
                shopTypes: ["items"],
            },
        ],
    },

    {
        id: "earth-1500s",
        name: "Earth (1500s)",
        setting: "Historical Earth (circa 1500)",
        settlements: [
            {
                name: "Beijing (Ming)",
                population: 600000,
                wealth: "aristocratic",
                magicness: "negligible",
                shopTypes: ["items", "weapons", "armor"],
            },
            {
                name: "Tenochtitlan",
                population: 200000,
                wealth: "wealthy",
                magicness: "negligible",
                shopTypes: ["items", "weapons"],
            },
            {
                name: "Constantinople",
                population: 400000,
                wealth: "wealthy",
                magicness: "negligible",
                shopTypes: ["items", "weapons", "armor"],
            },
            {
                name: "London",
                population: 50000,
                wealth: "comfortable",
                magicness: "negligible",
                shopTypes: ["items", "weapons"],
            },
            {
                name: "Delhi",
                population: 300000,
                wealth: "wealthy",
                magicness: "negligible",
                shopTypes: ["items", "weapons", "armor"],
            },
        ],
    },
];
