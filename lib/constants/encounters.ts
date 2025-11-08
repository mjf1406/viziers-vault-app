/** @format */

export const BIOMES = [
    "boreal forests/taiga",
    "deserts & xeric shrublands",
    "flooded grasslands & savannas",
    "mangroves",
    "Mediterranean forests, woodlands, & scrub",
    "montane grasslands & shrublands",
    "rock and ice",
    "temperate broadleaf & mixed forests",
    "temperate conifer forests",
    "temperate grasslands, savannas, & shrublands",
    "Tropical & Subtropical Coniferous Forests",
    "Tropical & Subtropical Dry Broadleaf Forests",
    "Tropical & Subtropical Grasslands, Savannas & Shrublands",
    "Tropical & Subtropical Moist Broadleaf Forests",
    "Tundra",
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




