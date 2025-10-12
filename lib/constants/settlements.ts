/** @format */

export const WEALTH_LEVELS = [
    "wretched",
    "squalid",
    "poor",
    "modest",
    "comfortable",
    "wealthy",
    "aristocratic",
] as const;

export type WealthLevel = (typeof WEALTH_LEVELS)[number];

export const MAGICNESS_LEVELS = [
    "negligible",
    "scarce",
    "rare",
    "sporadic",
    "common",
    "abundant",
    "widespread",
] as const;

export type MagicnessLevel = (typeof MAGICNESS_LEVELS)[number];

export const SHOP_TYPES = [
    "armor",
    "items",
    "poisons",
    "potions",
    "spell components",
    "scrolls",
    "weapons",
] as const;

export type ShopType = (typeof SHOP_TYPES)[number];
