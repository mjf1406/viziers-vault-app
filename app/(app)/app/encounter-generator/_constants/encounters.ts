/** @format */

export const BIOMES = [
    "boreal forests/taiga",
    "deserts & xeric shrublands",
    "flooded grasslands & savannas",
    "mangroves",
    "mediterranean forests, woodlands, & scrub",
    "montane grasslands & shrublands",
    "rock and ice",
    "temperate broadleaf & mixed forests",
    "temperate conifer forests",
    "temperate grasslands, savannas, & shrublands",
    "tropical & subtropical coniferous forests",
    "tropical & subtropical dry broadleaf forests",
    "tropical & subtropical grasslands, savannas & shrublands",
    "tropical & subtropical moist broadleaf forests",
    "tundra",
] as const;

export type Biome = (typeof BIOMES)[number];

export const TRAVEL_PACES = ["slow", "normal", "fast"] as const;

export type TravelPace = (typeof TRAVEL_PACES)[number];

export const ROADS = [
    "no road",
    "highway",
    "byway",
    "royalway",
    "bridleway",
] as const;

export type Road = (typeof ROADS)[number];

export const TRAVEL_MEDIUMS = ["ground", "air", "sea"] as const;

export type TravelMedium = (typeof TRAVEL_MEDIUMS)[number];

export const TIMES = ["day", "night"] as const;

export type Time = (typeof TIMES)[number];

export const SEASONS = ["spring", "summer", "fall", "winter"] as const;

export type Season = (typeof SEASONS)[number];

export const ENCOUNTER_TYPES = ["combat", "non-combat", "hazard"] as const;

export type EncounterType = (typeof ENCOUNTER_TYPES)[number];

// D&D Habitats (lowercase for display)
export const DND_HABITATS = [
    "arctic",
    "desert",
    "forest",
    "grassland",
    "mountain",
    "swamp",
    "coastal",
    "underdark",
    "underwater",
] as const;

export type DndHabitat = (typeof DND_HABITATS)[number];

// Map D&D habitat (lowercase) to Biome(s)
// Returns the first matching biome for each habitat
export function mapHabitatToBiome(habitat: string | null): Biome | null {
    if (!habitat) return null;

    const habitatLower = habitat.toLowerCase();

    // Arctic -> tundra, boreal forests/taiga, or rock and ice
    if (habitatLower === "arctic") {
        return "tundra";
    }

    // Desert -> deserts & xeric shrublands
    if (habitatLower === "desert") {
        return "deserts & xeric shrublands";
    }

    // Forest -> temperate broadleaf & mixed forests (default forest)
    if (habitatLower === "forest") {
        return "temperate broadleaf & mixed forests";
    }

    // Grassland -> temperate grasslands, savannas, & shrublands
    if (habitatLower === "grassland") {
        return "temperate grasslands, savannas, & shrublands";
    }

    // Mountain -> montane grasslands & shrublands
    if (habitatLower === "mountain") {
        return "montane grasslands & shrublands";
    }

    // Swamp -> mangroves
    if (habitatLower === "swamp") {
        return "mangroves";
    }

    // Coastal -> flooded grasslands & savannas
    if (habitatLower === "coastal") {
        return "flooded grasslands & savannas";
    }

    // Underdark -> no direct match, use forest as fallback
    if (habitatLower === "underdark") {
        return "temperate broadleaf & mixed forests";
    }

    // Underwater -> no direct match, use flooded as fallback
    if (habitatLower === "underwater") {
        return "flooded grasslands & savannas";
    }

    return null;
}

// Map Biome to D&D habitat (lowercase) for display
export function mapBiomeToHabitat(biome: Biome | null): DndHabitat | null {
    if (!biome) return null;

    const biomeLower = biome.toLowerCase();

    // Tundra, Boreal Forests/Taiga, Rock and Ice -> arctic
    if (
        biomeLower.includes("tundra") ||
        biomeLower.includes("boreal") ||
        biomeLower.includes("taiga") ||
        biomeLower.includes("rock and ice")
    ) {
        return "arctic";
    }

    // Deserts & Xeric Shrublands -> desert
    if (biomeLower.includes("desert") || biomeLower.includes("xeric")) {
        return "desert";
    }

    // Forests -> forest
    if (biomeLower.includes("forest")) {
        return "forest";
    }

    // Grasslands & Savannas -> grassland
    if (
        biomeLower.includes("grassland") ||
        biomeLower.includes("savanna") ||
        biomeLower.includes("savannas")
    ) {
        return "grassland";
    }

    // Montane Grasslands & Shrublands -> mountain
    if (biomeLower.includes("montane") || biomeLower.includes("mountain")) {
        return "mountain";
    }

    // Mangroves -> swamp
    if (biomeLower.includes("mangrove")) {
        return "swamp";
    }

    // Flooded Grasslands -> coastal
    if (biomeLower.includes("flooded")) {
        return "coastal";
    }

    // Default fallback to forest
    return "forest";
}

// Probability table biomes (for encounter probability calculations)
export const PROBABILITY_BIOMES = [
    "ARCTIC",
    "DESERT",
    "FOREST",
    "GRASSLAND",
    "HILL",
    "JUNGLE",
    "MOUNTAIN",
    "OPENWATER",
    "SWAMP",
    "UNDERDARK",
    "UNDERWATER",
    "WASTELAND",
    "WOODLAND",
] as const;

export type ProbabilityBiome = (typeof PROBABILITY_BIOMES)[number];

export const DIFFICULTY_PROBABILITIES = {
    trivial: {
        day: 0.1,
        night: 0.1,
    },
    easy: {
        day: 0.14,
        night: 0.14,
    },
    medium: {
        day: 0.4,
        night: 0.4,
    },
    hard: {
        day: 0.26,
        night: 0.26,
    },
    deadly: {
        day: 0.08,
        night: 0.08,
    },
    absurd: {
        day: 0.02,
        night: 0.02,
    },
} as const;

export const DIFFICULTY_ADJUSTMENTS = {
    "-4": {
        day: 0.05,
        night: 0.05,
    },
    "-3": {
        day: 0.09,
        night: 0.09,
    },
    "-2": {
        day: 0.12,
        night: 0.12,
    },
    "-1": {
        day: 0.15,
        night: 0.15,
    },
    "0": {
        day: 0.18,
        night: 0.18,
    },
    "1": {
        day: 0.15,
        night: 0.15,
    },
    "2": {
        day: 0.12,
        night: 0.12,
    },
    "3": {
        day: 0.09,
        night: 0.09,
    },
    "4": {
        day: 0.05,
        night: 0.05,
    },
} as const;

export const ENCOUNTER_PROBABILITIES = {
    "boreal forests/taiga": {
        day: {
            non_combat: 0.03,
            combat: 0.21,
            hazard: 0.05,
            total: 0.29,
        },
        night: {
            non_combat: 0.03,
            combat: 0.24,
            hazard: 0.05,
            total: 0.32,
        },
    },
    "deserts & xeric shrublands": {
        day: {
            non_combat: 0.06,
            combat: 0.18,
            hazard: 0.05,
            total: 0.29,
        },
        night: {
            non_combat: 0.04,
            combat: 0.24,
            hazard: 0.05,
            total: 0.33,
        },
    },
    "flooded grasslands & savannas": {
        day: {
            non_combat: 0.05,
            combat: 0.21,
            hazard: 0.05,
            total: 0.31,
        },
        night: {
            non_combat: 0.02,
            combat: 0.24,
            hazard: 0.05,
            total: 0.31,
        },
    },
    mangroves: {
        day: {
            non_combat: 0.03,
            combat: 0.24,
            hazard: 0.05,
            total: 0.32,
        },
        night: {
            non_combat: 0,
            combat: 0.27,
            hazard: 0.05,
            total: 0.32,
        },
    },
    "Mediterranean forests, woodlands, & scrub": {
        day: {
            non_combat: 0.06,
            combat: 0.18,
            hazard: 0.05,
            total: 0.29,
        },
        night: {
            non_combat: 0,
            combat: 0.24,
            hazard: 0.05,
            total: 0.29,
        },
    },
    "montane grasslands & shrublands": {
        day: {
            non_combat: 0.03,
            combat: 0.24,
            hazard: 0.05,
            total: 0.32,
        },
        night: {
            non_combat: 0,
            combat: 0.27,
            hazard: 0.05,
            total: 0.32,
        },
    },
    "rock and ice": {
        day: {
            non_combat: 0.03,
            combat: 0.21,
            hazard: 0.05,
            total: 0.29,
        },
        night: {
            non_combat: 0.03,
            combat: 0.24,
            hazard: 0.05,
            total: 0.32,
        },
    },
    "temperate broadleaf & mixed forests": {
        day: {
            non_combat: 0.03,
            combat: 0.21,
            hazard: 0.05,
            total: 0.29,
        },
        night: {
            non_combat: 0.03,
            combat: 0.24,
            hazard: 0.05,
            total: 0.32,
        },
    },
    "temperate conifer forests": {
        day: {
            non_combat: 0.03,
            combat: 0.21,
            hazard: 0.05,
            total: 0.29,
        },
        night: {
            non_combat: 0.03,
            combat: 0.24,
            hazard: 0.05,
            total: 0.32,
        },
    },
    "temperate grasslands, savannas, & shrublands": {
        day: {
            non_combat: 0.06,
            combat: 0.18,
            hazard: 0.05,
            total: 0.29,
        },
        night: {
            non_combat: 0.03,
            combat: 0.24,
            hazard: 0.05,
            total: 0.32,
        },
    },
    "tropical & subtropical coniferous forests": {
        day: {
            non_combat: 0.02,
            combat: 0.24,
            hazard: 0.05,
            total: 0.31,
        },
        night: {
            non_combat: 0,
            combat: 0.27,
            hazard: 0.05,
            total: 0.32,
        },
    },
    "tropical & subtropical dry broadleaf forests": {
        day: {
            non_combat: 0.02,
            combat: 0.24,
            hazard: 0.05,
            total: 0.31,
        },
        night: {
            non_combat: 0,
            combat: 0.27,
            hazard: 0.05,
            total: 0.32,
        },
    },
    "tropical & subtropical grasslands, savannas & shrublands": {
        day: {
            non_combat: 0.06,
            combat: 0.18,
            hazard: 0.05,
            total: 0.29,
        },
        night: {
            non_combat: 0.03,
            combat: 0.24,
            hazard: 0.05,
            total: 0.32,
        },
    },
    "tropical & subtropical moist broadleaf forests": {
        day: {
            non_combat: 0.02,
            combat: 0.24,
            hazard: 0.05,
            total: 0.31,
        },
        night: {
            non_combat: 0,
            combat: 0.27,
            hazard: 0.05,
            total: 0.32,
        },
    },
    tundra: {
        day: {
            non_combat: 0.03,
            combat: 0.21,
            hazard: 0.05,
            total: 0.29,
        },
        night: {
            non_combat: 0.03,
            combat: 0.24,
            hazard: 0.05,
            total: 0.32,
        },
    },
} as const;

export const PACE_MODIFIERS = {
    slow: {
        day: {
            non_combat: 0.2,
            combat: -0.2,
            hazard: -0.2,
            percent_type: 0,
        },
        night: {
            non_combat: 0.2,
            combat: -0.2,
            hazard: -0.2,
            percent_type: 0,
        },
    },
    normal: {
        day: {
            non_combat: 0,
            combat: 0,
            hazard: 0,
            percent_type: 0,
        },
        night: {
            non_combat: 0,
            combat: 0,
            hazard: 0,
            percent_type: 0,
        },
    },
    fast: {
        day: {
            non_combat: -0.2,
            combat: 0.2,
            hazard: 0.2,
            percent_type: 0,
        },
        night: {
            non_combat: -0.2,
            combat: 0.2,
            hazard: 0.2,
            percent_type: 0,
        },
    },
} as const;

export const ROAD_MODIFIERS = {
    highway: {
        day: {
            non_combat: 0.2,
            combat: -0.35,
            hazard: -0.2,
            percent_type: 0,
        },
        night: {
            non_combat: 0.2,
            combat: -0.35,
            hazard: -0.2,
            percent_type: 0,
        },
    },
    byway: {
        day: {
            non_combat: 0.1,
            combat: -0.25,
            hazard: -0.1,
            percent_type: 0,
        },
        night: {
            non_combat: 0.1,
            combat: -0.25,
            hazard: -0.1,
            percent_type: 0,
        },
    },
    royalway: {
        day: {
            non_combat: 0.15,
            combat: -0.5,
            hazard: -0.2,
            percent_type: 0,
        },
        night: {
            non_combat: 0.15,
            combat: -0.5,
            hazard: -0.2,
            percent_type: 0,
        },
    },
    bridleway: {
        day: {
            non_combat: 0.05,
            combat: -0.1,
            hazard: -0.05,
            percent_type: 0,
        },
        night: {
            non_combat: 0.05,
            combat: -0.1,
            hazard: -0.05,
            percent_type: 0,
        },
    },
    "no road": {
        day: {
            non_combat: 0.0,
            combat: 0,
            hazard: 0,
            percent_type: 0,
        },
        night: {
            non_combat: 0.0,
            combat: 0,
            hazard: 0,
            percent_type: 0,
        },
    },
} as const;

// XP Thresholds by Character Level
export const XP_THRESHOLDS = [
    {
        char_level: 1,
        trivial: 8,
        easy: 25,
        medium: 50,
        hard: 75,
        deadly: 100,
        absurd: 125,
    },
    {
        char_level: 2,
        trivial: 17,
        easy: 50,
        medium: 100,
        hard: 150,
        deadly: 200,
        absurd: 250,
    },
    {
        char_level: 3,
        trivial: 25,
        easy: 75,
        medium: 150,
        hard: 225,
        deadly: 400,
        absurd: 575,
    },
    {
        char_level: 4,
        trivial: 42,
        easy: 125,
        medium: 250,
        hard: 375,
        deadly: 500,
        absurd: 625,
    },
    {
        char_level: 5,
        trivial: 83,
        easy: 250,
        medium: 500,
        hard: 750,
        deadly: 1100,
        absurd: 1450,
    },
    {
        char_level: 6,
        trivial: 100,
        easy: 300,
        medium: 600,
        hard: 900,
        deadly: 1400,
        absurd: 1900,
    },
    {
        char_level: 7,
        trivial: 117,
        easy: 350,
        medium: 750,
        hard: 1100,
        deadly: 1700,
        absurd: 2300,
    },
    {
        char_level: 8,
        trivial: 150,
        easy: 450,
        medium: 900,
        hard: 1400,
        deadly: 2100,
        absurd: 2800,
    },
    {
        char_level: 9,
        trivial: 183,
        easy: 550,
        medium: 1100,
        hard: 1600,
        deadly: 2400,
        absurd: 3200,
    },
    {
        char_level: 10,
        trivial: 200,
        easy: 600,
        medium: 1200,
        hard: 1900,
        deadly: 2800,
        absurd: 3700,
    },
    {
        char_level: 11,
        trivial: 267,
        easy: 800,
        medium: 1600,
        hard: 2400,
        deadly: 3600,
        absurd: 4800,
    },
    {
        char_level: 12,
        trivial: 333,
        easy: 1000,
        medium: 2000,
        hard: 3000,
        deadly: 4500,
        absurd: 6000,
    },
    {
        char_level: 13,
        trivial: 367,
        easy: 1100,
        medium: 2200,
        hard: 3400,
        deadly: 5100,
        absurd: 6800,
    },
    {
        char_level: 14,
        trivial: 417,
        easy: 1250,
        medium: 2500,
        hard: 3800,
        deadly: 5700,
        absurd: 7600,
    },
    {
        char_level: 15,
        trivial: 467,
        easy: 1400,
        medium: 2800,
        hard: 4300,
        deadly: 6400,
        absurd: 8500,
    },
    {
        char_level: 16,
        trivial: 533,
        easy: 1600,
        medium: 3200,
        hard: 4800,
        deadly: 7200,
        absurd: 9600,
    },
    {
        char_level: 17,
        trivial: 667,
        easy: 2000,
        medium: 3900,
        hard: 5900,
        deadly: 8800,
        absurd: 11700,
    },
    {
        char_level: 18,
        trivial: 700,
        easy: 2100,
        medium: 4200,
        hard: 6300,
        deadly: 9500,
        absurd: 12700,
    },
    {
        char_level: 19,
        trivial: 800,
        easy: 2400,
        medium: 4900,
        hard: 7300,
        deadly: 10900,
        absurd: 14500,
    },
    {
        char_level: 20,
        trivial: 933,
        easy: 2800,
        medium: 5700,
        hard: 8500,
        deadly: 12700,
        absurd: 16900,
    },
];
// Monster Statistics by Challenge Rating
export const MONSTER_STATS = [
    {
        cr: 0,
        cr_number: 0,
        xp: 10,
        prof_bonus: 2,
        armor_class: 13,
        hp: "1-6",
        attack_bonus: 3,
        damage_per_round: "0-1",
        save_dc: 13,
    },
    {
        cr: 1 / 8,
        cr_number: 0.125,
        xp: 25,
        prof_bonus: 2,
        armor_class: 13,
        hp: "7-35",
        attack_bonus: 3,
        damage_per_round: "2-3",
        save_dc: 13,
    },
    {
        cr: 1 / 4,
        cr_number: 0.25,
        xp: 50,
        prof_bonus: 2,
        armor_class: 13,
        hp: "36-49",
        attack_bonus: 3,
        damage_per_round: "4-5",
        save_dc: 13,
    },
    {
        cr: 1 / 2,
        cr_number: 0.5,
        xp: 100,
        prof_bonus: 2,
        armor_class: 13,
        hp: "50-70",
        attack_bonus: 3,
        damage_per_round: "6-8",
        save_dc: 13,
    },
    {
        cr: 1,
        cr_number: 1,
        xp: 200,
        prof_bonus: 2,
        armor_class: 13,
        hp: "71-85",
        attack_bonus: 3,
        damage_per_round: "9-14",
        save_dc: 13,
    },
    {
        cr: 2,
        cr_number: 2,
        xp: 450,
        prof_bonus: 2,
        armor_class: 13,
        hp: "86-100",
        attack_bonus: 3,
        damage_per_round: "15-20",
        save_dc: 13,
    },
    {
        cr: 3,
        cr_number: 3,
        xp: 700,
        prof_bonus: 2,
        armor_class: 13,
        hp: "101-115",
        attack_bonus: 4,
        damage_per_round: "21-26",
        save_dc: 13,
    },
    {
        cr: 4,
        cr_number: 4,
        xp: 1100,
        prof_bonus: 2,
        armor_class: 14,
        hp: "116-130",
        attack_bonus: 5,
        damage_per_round: "27-32",
        save_dc: 14,
    },
    {
        cr: 5,
        cr_number: 5,
        xp: 1800,
        prof_bonus: 3,
        armor_class: 15,
        hp: "131-145",
        attack_bonus: 6,
        damage_per_round: "33-38",
        save_dc: 15,
    },
    {
        cr: 6,
        cr_number: 6,
        xp: 2300,
        prof_bonus: 3,
        armor_class: 15,
        hp: "146-160",
        attack_bonus: 6,
        damage_per_round: "39-44",
        save_dc: 15,
    },
    {
        cr: 7,
        cr_number: 7,
        xp: 2900,
        prof_bonus: 3,
        armor_class: 15,
        hp: "161-175",
        attack_bonus: 6,
        damage_per_round: "45-50",
        save_dc: 15,
    },
    {
        cr: 8,
        cr_number: 8,
        xp: 3900,
        prof_bonus: 3,
        armor_class: 16,
        hp: "176-190",
        attack_bonus: 7,
        damage_per_round: "51-56",
        save_dc: 16,
    },
    {
        cr: 9,
        cr_number: 9,
        xp: 5000,
        prof_bonus: 4,
        armor_class: 16,
        hp: "191-205",
        attack_bonus: 7,
        damage_per_round: "57-62",
        save_dc: 16,
    },
    {
        cr: 10,
        cr_number: 10,
        xp: 5900,
        prof_bonus: 4,
        armor_class: 17,
        hp: "206-220",
        attack_bonus: 7,
        damage_per_round: "63-68",
        save_dc: 16,
    },
    {
        cr: 11,
        cr_number: 11,
        xp: 7200,
        prof_bonus: 4,
        armor_class: 17,
        hp: "221-235",
        attack_bonus: 8,
        damage_per_round: "69-74",
        save_dc: 17,
    },
    {
        cr: 12,
        cr_number: 12,
        xp: 8400,
        prof_bonus: 4,
        armor_class: 17,
        hp: "236-250",
        attack_bonus: 8,
        damage_per_round: "75-80",
        save_dc: 18,
    },
    {
        cr: 13,
        cr_number: 13,
        xp: 10000,
        prof_bonus: 5,
        armor_class: 18,
        hp: "251-265",
        attack_bonus: 8,
        damage_per_round: "81-86",
        save_dc: 18,
    },
    {
        cr: 14,
        cr_number: 14,
        xp: 11500,
        prof_bonus: 5,
        armor_class: 18,
        hp: "266-280",
        attack_bonus: 8,
        damage_per_round: "87-92",
        save_dc: 18,
    },
    {
        cr: 15,
        cr_number: 15,
        xp: 13000,
        prof_bonus: 5,
        armor_class: 18,
        hp: "281-295",
        attack_bonus: 8,
        damage_per_round: "93-98",
        save_dc: 18,
    },
    {
        cr: 16,
        cr_number: 16,
        xp: 15000,
        prof_bonus: 5,
        armor_class: 18,
        hp: "296-310",
        attack_bonus: 9,
        damage_per_round: "99-104",
        save_dc: 18,
    },
    {
        cr: 17,
        cr_number: 17,
        xp: 18000,
        prof_bonus: 6,
        armor_class: 19,
        hp: "311-325",
        attack_bonus: 10,
        damage_per_round: "105-110",
        save_dc: 19,
    },
    {
        cr: 18,
        cr_number: 18,
        xp: 20000,
        prof_bonus: 6,
        armor_class: 19,
        hp: "326-340",
        attack_bonus: 10,
        damage_per_round: "111-116",
        save_dc: 19,
    },
    {
        cr: 19,
        cr_number: 19,
        xp: 22000,
        prof_bonus: 6,
        armor_class: 19,
        hp: "341-355",
        attack_bonus: 10,
        damage_per_round: "117-122",
        save_dc: 19,
    },
    {
        cr: 20,
        cr_number: 20,
        xp: 25000,
        prof_bonus: 6,
        armor_class: 19,
        hp: "356-400",
        attack_bonus: 10,
        damage_per_round: "123-140",
        save_dc: 19,
    },
    {
        cr: 21,
        cr_number: 21,
        xp: 33000,
        prof_bonus: 7,
        armor_class: 19,
        hp: "401-445",
        attack_bonus: 11,
        damage_per_round: "141-158",
        save_dc: 20,
    },
    {
        cr: 22,
        cr_number: 22,
        xp: 41000,
        prof_bonus: 7,
        armor_class: 19,
        hp: "446-490",
        attack_bonus: 11,
        damage_per_round: "159-176",
        save_dc: 20,
    },
    {
        cr: 23,
        cr_number: 23,
        xp: 50000,
        prof_bonus: 7,
        armor_class: 19,
        hp: "491-535",
        attack_bonus: 11,
        damage_per_round: "177-194",
        save_dc: 20,
    },
    {
        cr: 24,
        cr_number: 24,
        xp: 62000,
        prof_bonus: 7,
        armor_class: 19,
        hp: "536-580",
        attack_bonus: 11,
        damage_per_round: "195-212",
        save_dc: 21,
    },
    {
        cr: 25,
        cr_number: 25,
        xp: 75000,
        prof_bonus: 8,
        armor_class: 19,
        hp: "581-625",
        attack_bonus: 12,
        damage_per_round: "213-230",
        save_dc: 21,
    },
    {
        cr: 26,
        cr_number: 26,
        xp: 90000,
        prof_bonus: 8,
        armor_class: 19,
        hp: "626-670",
        attack_bonus: 12,
        damage_per_round: "231-248",
        save_dc: 21,
    },
    {
        cr: 27,
        cr_number: 27,
        xp: 105000,
        prof_bonus: 8,
        armor_class: 19,
        hp: "671-715",
        attack_bonus: 13,
        damage_per_round: "249-266",
        save_dc: 22,
    },
    {
        cr: 28,
        cr_number: 28,
        xp: 120000,
        prof_bonus: 8,
        armor_class: 19,
        hp: "716-760",
        attack_bonus: 13,
        damage_per_round: "267-284",
        save_dc: 22,
    },
    {
        cr: 29,
        cr_number: 29,
        xp: 135000,
        prof_bonus: 9,
        armor_class: 19,
        hp: "760-805",
        attack_bonus: 13,
        damage_per_round: "285-302",
        save_dc: 22,
    },
    {
        cr: 30,
        cr_number: 30,
        xp: 155000,
        prof_bonus: 9,
        armor_class: 19,
        hp: "805-850",
        attack_bonus: 14,
        damage_per_round: "303-320",
        save_dc: 23,
    },
];
// Encounter Multipliers
export const ENC_XP_MULTIPLIERS = [
    { party_size: 1, number_of_monsters: 1, multiplier: 1.5 },
    { party_size: 1, number_of_monsters: 2, multiplier: 2 },
    { party_size: 1, number_of_monsters: 3, multiplier: 2.5 },
    { party_size: 1, number_of_monsters: 4, multiplier: 2.5 },
    { party_size: 1, number_of_monsters: 5, multiplier: 2.5 },
    { party_size: 1, number_of_monsters: 6, multiplier: 2.5 },
    { party_size: 1, number_of_monsters: 7, multiplier: 3 },
    { party_size: 1, number_of_monsters: 8, multiplier: 3 },
    { party_size: 1, number_of_monsters: 9, multiplier: 3 },
    { party_size: 1, number_of_monsters: 10, multiplier: 3 },
    { party_size: 1, number_of_monsters: 11, multiplier: 4 },
    { party_size: 1, number_of_monsters: 12, multiplier: 4 },
    { party_size: 1, number_of_monsters: 13, multiplier: 4 },
    { party_size: 1, number_of_monsters: 14, multiplier: 4 },
    { party_size: 1, number_of_monsters: 15, multiplier: 5 },
    { party_size: 2, number_of_monsters: 1, multiplier: 1.5 },
    { party_size: 2, number_of_monsters: 2, multiplier: 2 },
    { party_size: 2, number_of_monsters: 3, multiplier: 2.5 },
    { party_size: 2, number_of_monsters: 4, multiplier: 2.5 },
    { party_size: 2, number_of_monsters: 5, multiplier: 2.5 },
    { party_size: 2, number_of_monsters: 6, multiplier: 2.5 },
    { party_size: 2, number_of_monsters: 7, multiplier: 3 },
    { party_size: 2, number_of_monsters: 8, multiplier: 3 },
    { party_size: 2, number_of_monsters: 9, multiplier: 3 },
    { party_size: 2, number_of_monsters: 10, multiplier: 3 },
    { party_size: 2, number_of_monsters: 11, multiplier: 4 },
    { party_size: 2, number_of_monsters: 12, multiplier: 4 },
    { party_size: 2, number_of_monsters: 13, multiplier: 4 },
    { party_size: 2, number_of_monsters: 14, multiplier: 4 },
    { party_size: 2, number_of_monsters: 15, multiplier: 5 },
    { party_size: 3, number_of_monsters: 1, multiplier: 1 },
    { party_size: 3, number_of_monsters: 2, multiplier: 1.5 },
    { party_size: 3, number_of_monsters: 3, multiplier: 2 },
    { party_size: 3, number_of_monsters: 4, multiplier: 2 },
    { party_size: 3, number_of_monsters: 5, multiplier: 2 },
    { party_size: 3, number_of_monsters: 6, multiplier: 2 },
    { party_size: 3, number_of_monsters: 7, multiplier: 2.5 },
    { party_size: 3, number_of_monsters: 8, multiplier: 2.5 },
    { party_size: 3, number_of_monsters: 9, multiplier: 2.5 },
    { party_size: 3, number_of_monsters: 10, multiplier: 2.5 },
    { party_size: 3, number_of_monsters: 11, multiplier: 3 },
    { party_size: 3, number_of_monsters: 12, multiplier: 3 },
    { party_size: 3, number_of_monsters: 13, multiplier: 3 },
    { party_size: 3, number_of_monsters: 14, multiplier: 3 },
    { party_size: 3, number_of_monsters: 15, multiplier: 4 },
    { party_size: 4, number_of_monsters: 1, multiplier: 1 },
    { party_size: 4, number_of_monsters: 2, multiplier: 1.5 },
    { party_size: 4, number_of_monsters: 3, multiplier: 2 },
    { party_size: 4, number_of_monsters: 4, multiplier: 2 },
    { party_size: 4, number_of_monsters: 5, multiplier: 2 },
    { party_size: 4, number_of_monsters: 6, multiplier: 2 },
    { party_size: 4, number_of_monsters: 7, multiplier: 2.5 },
    { party_size: 4, number_of_monsters: 8, multiplier: 2.5 },
    { party_size: 4, number_of_monsters: 9, multiplier: 2.5 },
    { party_size: 4, number_of_monsters: 10, multiplier: 2.5 },
    { party_size: 4, number_of_monsters: 11, multiplier: 3 },
    { party_size: 4, number_of_monsters: 12, multiplier: 3 },
    { party_size: 4, number_of_monsters: 13, multiplier: 3 },
    { party_size: 4, number_of_monsters: 14, multiplier: 3 },
    { party_size: 4, number_of_monsters: 15, multiplier: 4 },
    { party_size: 5, number_of_monsters: 1, multiplier: 1 },
    { party_size: 5, number_of_monsters: 2, multiplier: 1.5 },
    { party_size: 5, number_of_monsters: 3, multiplier: 2 },
    { party_size: 5, number_of_monsters: 4, multiplier: 2 },
    { party_size: 5, number_of_monsters: 5, multiplier: 2 },
    { party_size: 5, number_of_monsters: 6, multiplier: 2 },
    { party_size: 5, number_of_monsters: 7, multiplier: 2.5 },
    { party_size: 5, number_of_monsters: 8, multiplier: 2.5 },
    { party_size: 5, number_of_monsters: 9, multiplier: 2.5 },
    { party_size: 5, number_of_monsters: 10, multiplier: 2.5 },
    { party_size: 5, number_of_monsters: 11, multiplier: 3 },
    { party_size: 5, number_of_monsters: 12, multiplier: 3 },
    { party_size: 5, number_of_monsters: 13, multiplier: 3 },
    { party_size: 5, number_of_monsters: 14, multiplier: 3 },
    { party_size: 5, number_of_monsters: 15, multiplier: 4 },
    { party_size: 6, number_of_monsters: 1, multiplier: 0.5 },
    { party_size: 6, number_of_monsters: 2, multiplier: 1 },
    { party_size: 6, number_of_monsters: 3, multiplier: 1.5 },
    { party_size: 6, number_of_monsters: 4, multiplier: 1.5 },
    { party_size: 6, number_of_monsters: 5, multiplier: 1.5 },
    { party_size: 6, number_of_monsters: 6, multiplier: 1.5 },
    { party_size: 6, number_of_monsters: 7, multiplier: 2 },
    { party_size: 6, number_of_monsters: 8, multiplier: 2 },
    { party_size: 6, number_of_monsters: 9, multiplier: 2 },
    { party_size: 6, number_of_monsters: 10, multiplier: 2 },
    { party_size: 6, number_of_monsters: 11, multiplier: 2.5 },
    { party_size: 6, number_of_monsters: 12, multiplier: 2.5 },
    { party_size: 6, number_of_monsters: 13, multiplier: 2.5 },
    { party_size: 6, number_of_monsters: 14, multiplier: 2.5 },
    { party_size: 6, number_of_monsters: 15, multiplier: 3 },
];
// Character Advancement
export const CHARACTER_ADVANCEMENT = [
    { xp: 0, level: 1, proficiency_bonus: 2 },
    { xp: 300, level: 2, proficiency_bonus: 2 },
    { xp: 900, level: 3, proficiency_bonus: 2 },
    { xp: 2700, level: 4, proficiency_bonus: 2 },
    { xp: 6500, level: 5, proficiency_bonus: 3 },
    { xp: 14000, level: 6, proficiency_bonus: 3 },
    { xp: 23000, level: 7, proficiency_bonus: 3 },
    { xp: 34000, level: 8, proficiency_bonus: 3 },
    { xp: 48000, level: 9, proficiency_bonus: 4 },
    { xp: 64000, level: 10, proficiency_bonus: 4 },
    { xp: 85000, level: 11, proficiency_bonus: 4 },
    { xp: 100000, level: 12, proficiency_bonus: 4 },
    { xp: 120000, level: 13, proficiency_bonus: 5 },
    { xp: 140000, level: 14, proficiency_bonus: 5 },
    { xp: 165000, level: 15, proficiency_bonus: 5 },
    { xp: 195000, level: 16, proficiency_bonus: 5 },
    { xp: 225000, level: 17, proficiency_bonus: 6 },
    { xp: 265000, level: 18, proficiency_bonus: 6 },
    { xp: 305000, level: 19, proficiency_bonus: 6 },
    { xp: 355000, level: 20, proficiency_bonus: 6 },
];
