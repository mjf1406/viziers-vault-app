/** @format */

"use client";

import db from "@/lib/db";
import type { GenerateMagicShopOpts } from "../_components/GenMagicShopResponsiveDialog";
import { PREMADE_WORLDS } from "@/lib/pre-made-worlds";
import { WEALTH_LEVELS } from "@/lib/constants/settlements";

function buildOptions(opts: GenerateMagicShopOpts) {
    const {
        population,
        wealth,
        magicness,
        stockTypes,
        worldId,
        settlementId,
        stockMultiplier,
        inputMode,
        settings,
        worlds,
    } = opts;

    let resolvedPopulation: number | null = null;

    const hasNumericPopulation =
        typeof population === "number" && Number.isFinite(population);

    if (inputMode === "by-settlement" && settlementId) {
        if (settlementId.includes(":")) {
            // Premade settlement id format: `${worldId}:${settlementName}`
            const [premadeWorldId, settlementName] = settlementId.split(":", 2);
            const world = PREMADE_WORLDS.find((w) => w.id === premadeWorldId);
            const premade = world?.settlements?.find(
                (s) => s.name === settlementName
            );
            resolvedPopulation =
                typeof premade?.population === "number"
                    ? premade.population
                    : null;
        } else {
            // DB settlement by id from provided worlds snapshot
            const fromWorlds = Array.isArray(worlds) ? (worlds as any[]) : [];
            const match = fromWorlds
                .flatMap((w: any) => (w?.settlements ?? []) as any[])
                .find((s: any) => s?.id === settlementId);
            resolvedPopulation =
                typeof match?.population === "number" ? match.population : null;
        }
    } else if (hasNumericPopulation) {
        resolvedPopulation = population as number;
    }

    if (!resolvedPopulation || !Number.isFinite(resolvedPopulation)) {
        throw new Error(
            "Could not resolve population from the provided inputs"
        );
    }

    return {
        population: resolvedPopulation,
        wealth: normalizeWealth(wealth as number),
        magicLevel: magicness,
        stockTypes: Array.isArray(stockTypes) ? stockTypes : undefined,
        stockMultiplier: stockMultiplier ?? 1,
        settings: settings ?? null,
    } as any;
}

export type GenerateMagicShopInput = {
    name?: string | null;
    options: GenerateMagicShopOpts;
    quantity?: number | null;
};

export default async function generateMagicShop(
    input: GenerateMagicShopInput,
    user?: { id?: string | null; plan?: string | null }
): Promise<string[]> {
    const uid = user?.id ?? null;
    if (!uid) {
        throw new Error("You must be logged in to save magic shops");
    }

    const createdAt = new Date();
    const qtyRaw = input?.quantity ?? 1;
    const qty = Math.min(10, Math.max(1, Number(qtyRaw) || 1));
    const name = input?.name?.trim() || undefined;
    const options = buildOptions(input.options);
    console.log("generateMagicShop options:", { name, options, qty, user });

    const ids: string[] = [];
    for (let i = 0; i < qty; i++) {
        const id =
            (globalThis as any)?.crypto?.randomUUID?.() ??
            Math.random().toString(36).slice(2);

        const items = await generateMagicShopItems(options);

        const record: any = {
            name,
            createdAt,
            items,
            creatorId: uid,
        };

        await db.transact(
            db.tx.magicShops[id].create(record).link({ $user: uid })
        );
        ids.push(id);
    }

    return ids;
}

function normalizeWealth(wealth: number): number {
    return (wealth - 1) / (WEALTH_LEVELS.length - 1);
}

async function generateMagicShopItems(options: any): Promise<any[]> {
    const { population, stockMultiplier, wealth, settings } = options;

    const itemCount = calculateItemCount(population, stockMultiplier, settings);
    const priceModifier = calculatePriceModifiers(wealth, settings);
    const prices = calculatePrices(priceModifier);
    const rarityDistribution = generateRarityDistribution(
        population,
        wealth,
        settings
    );
    console.log("Magic Shop Items Calculated Params", {
        itemCount,
        priceModifier,
        prices,
        rarityDistribution,
    });

    return [];
}

function calculateItemCount(
    population: number,
    stockMultiplier: number,
    settings?: any | null
): number {
    const SLOT_BETA = settings?.slotBeta ?? 0.5; // TODO: add to settings
    const SLOT_SCALE = settings?.slotScale ?? 0.08; // TODO: add to settings
    const baseCount = Math.max(
        1,
        Math.round(SLOT_SCALE * Math.pow(population, SLOT_BETA))
    );
    return Math.round(baseCount * stockMultiplier);
}

function calculatePriceModifiers(
    wealth: number,
    settings?: any | null
): Record<keyof typeof BASE_PRICES, number> {
    const WEALTH_INFLUENCE = settings?.wealthInfluence ?? 1; // TODO: add to settings
    const MAX_PRICE_CHANGE = settings?.maxPriceChange ?? 0.5; // TODO: add to settings
    const RARITY_PROGRESSION = settings?.rarityProgressionExponent ?? 0.5; // TODO: add to settings
    /* 
    Setting: rarityProgressionExponent (default: 1.0)
        < 1.0: Compresses the price differences between rarities (e.g., 0.7 makes Legendary items relatively cheaper compared to Common)
        = 1.0: Linear progression (current behavior)
        > 1.0: Amplifies the gap (e.g., 1.3 makes high-rarity items even more expensive relative to low-rarity)
    */

    const baseMultiplier =
        1 - WEALTH_INFLUENCE * (2 * MAX_PRICE_CHANGE) * (wealth - 0.5);

    const rarities = Object.keys(BASE_PRICES) as Array<
        keyof typeof BASE_PRICES
    >;
    const modifiers: Record<keyof typeof BASE_PRICES, number> = {} as any;

    for (let i = 0; i < rarities.length; i++) {
        const rarity = rarities[i];
        // Scale from 0 (Common) to 1 (Legendary)
        const rarityFactor = i / (rarities.length - 1);
        // Apply exponent to modify progression curve
        const adjustedFactor = Math.pow(rarityFactor, RARITY_PROGRESSION);
        // Blend the base multiplier with rarity-scaled adjustment
        const rarityMultiplier =
            baseMultiplier * (1 + adjustedFactor * (RARITY_PROGRESSION - 1));

        modifiers[rarity] = Math.round(rarityMultiplier * 100) / 100;
    }

    return modifiers;
}

function calculatePrices(
    priceModifiers: Record<keyof typeof BASE_PRICES, number>
) {
    const result: typeof BASE_PRICES = {} as typeof BASE_PRICES;

    for (const [rarity, properties] of Object.entries(BASE_PRICES)) {
        const modifier = priceModifiers[rarity as keyof typeof BASE_PRICES];
        result[rarity as keyof typeof BASE_PRICES] = {} as any;

        for (const [prop, price] of Object.entries(properties)) {
            result[rarity as keyof typeof BASE_PRICES][
                prop as keyof typeof properties
            ] = Math.round(price * modifier * 100) / 100;
        }
    }

    return result;
}

const BASE_PRICES = {
    // TODO: add to settings
    Common: {
        NONE: 25,
        MINOR: 50,
        MAJOR: 75,
        WONDROUS: 100,
    },
    Uncommon: {
        NONE: 110,
        MINOR: 208,
        MAJOR: 305,
        WONDROUS: 500,
    },
    Rare: {
        NONE: 510,
        MINOR: 1633,
        MAJOR: 2755,
        WONDROUS: 5000,
    },
    "Very Rare": {
        NONE: 5100,
        MINOR: 16300,
        MAJOR: 27500,
        WONDROUS: 50000,
    },
    Legendary: {
        NONE: 51000,
        MINOR: 163250,
        MAJOR: 275500,
        WONDROUS: 500000,
    },
};

const RARITY_THRESHOLDS = {
    // TODO: add to settings
    Common: 0,
    Uncommon: 500,
    Rare: 2500,
    "Very Rare": 10000,
    Legendary: 100000,
};

function generateRarityDistribution(
    population: number,
    magicLevel: number, // 0-1 normalized
    settings?: any | null
): Record<keyof typeof BASE_PRICES, number> {
    const MAGIC_BIAS = settings?.magicRarityBias ?? 2; // TODO: add to settings
    // <1.0 = gentle shift, >1.0 = aggressive shift toward rare
    const GATING = settings?.rarityPopulationGating ?? "strict"; // TODO: add to settings
    /*
    rarityPopulationGating gives users semantic control:
        "strict": Village of 1000 literally cannot have Legendary items (0% chance)
        "soft": Village might rarely have one, but heavily penalized
        "none": Pure magicness-based distribution (good for high-fantasy settings)
    */

    const rarities = Object.keys(BASE_PRICES) as Array<
        keyof typeof BASE_PRICES
    >;
    const weights: Record<keyof typeof BASE_PRICES, number> = {} as any;

    for (let i = 0; i < rarities.length; i++) {
        const rarity = rarities[i];
        const threshold = RARITY_THRESHOLDS[rarity];

        const rarityIndex = i / (rarities.length - 1); // 0 to 1
        const baseWeight = Math.pow(
            1 - rarityIndex + magicLevel * rarityIndex,
            MAGIC_BIAS
        );

        let gatePenalty = 1;
        if (population < threshold) {
            if (GATING === "strict") {
                gatePenalty = 0; // Hard cutoff
            } else if (GATING === "soft") {
                const ratio = population / threshold;
                gatePenalty = Math.pow(ratio, 2);
            }
        }

        weights[rarity] = baseWeight * gatePenalty;
    }

    const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
    const distribution: Record<keyof typeof BASE_PRICES, number> = {} as any;

    for (const rarity of rarities) {
        distribution[rarity] =
            Math.round((weights[rarity] / total) * 100) / 100;
    }

    return distribution;
}
