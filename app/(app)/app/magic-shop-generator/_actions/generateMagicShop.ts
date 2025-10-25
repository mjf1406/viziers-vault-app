/** @format */

"use server";

import type { GenerateMagicShopOpts } from "../_components/GenMagicShopResponsiveDialog";
import { PREMADE_WORLDS } from "@/lib/pre-made-worlds";
import { WEALTH_LEVELS } from "@/lib/constants/settlements";
import dbServer from "@/server/db-server";
import { SPELL_LEVEL_TO_RARITY, SPELL_SCROLL_PRICES_GP } from "@/lib/5e-data";

const LOWER_TO_TITLE_RARITY = {
    common: "Common",
    uncommon: "Uncommon",
    rare: "Rare",
    "very rare": "Very Rare",
    legendary: "Legendary",
} as const;

function normalizeWealth(wealth: number): number {
    return (wealth - 1) / (WEALTH_LEVELS.length - 1);
}

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

    // Map high-level stock categories to underlying item.type values
    // Never include "scroll" here; scrolls and spell components are handled separately
    const selectedStockTypes = Array.isArray(stockTypes)
        ? (stockTypes as string[]).map((s) => String(s).toLowerCase().trim())
        : [];

    const wantsScrolls = selectedStockTypes.includes("scrolls");
    const wantsSpellComponents =
        selectedStockTypes.includes("spell components");

    const categoryToItemTypes: Record<string, string[]> = {
        items: ["ring", "rod", "staff", "wand", "wondrous item"],
        weapons: ["weapon"],
        armor: ["armor"],
        potions: ["potion"],
        poisons: ["poison"],
        scrolls: ["scrolls"],
        "spell components": ["spell components"],
    };

    const expandedItemTypes = Array.from(
        new Set(selectedStockTypes.flatMap((k) => categoryToItemTypes[k] ?? []))
    );

    return {
        population: resolvedPopulation,
        wealth: normalizeWealth(wealth as number),
        magicLevel: magicness,
        stockTypes: expandedItemTypes.length ? expandedItemTypes : undefined,
        includeScrolls: wantsScrolls,
        includeSpellComponents: wantsSpellComponents,
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
    const uid = user?.id ?? undefined;
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

        const rarityDistribution = generateRarityDistribution(
            options.population,
            options.wealth,
            options.settings
        );

        const [gear, spellBundles] = await Promise.all([
            generateItems(options, rarityDistribution),
            generateSpells(options, rarityDistribution),
        ]);

        const record: any = {
            name,
            createdAt,
            items: {
                gear: gear ?? [],
                scrolls: spellBundles?.scrolls ?? [],
                components: spellBundles?.components ?? [],
            },
            creatorId: uid,
        };
        await dbServer.transact(
            dbServer.tx.magicShops[id].create(record).link({ $user: uid })
        );
        ids.push(id);
    }

    return ids;
}

type SpellBundle = { scrolls: any[]; components: any[] };

async function generateSpells(
    options: any,
    rarityDistribution: Record<string, number>
): Promise<SpellBundle | null> {
    const includeScrolls = !!options?.includeScrolls;
    const includeComponents = !!options?.includeSpellComponents;
    if (!includeScrolls && !includeComponents)
        return { scrolls: [], components: [] };

    const res = await dbServer.query({ dnd5e_spells: {} });
    const allSpells = (res?.dnd5e_spells ?? []) as any[];

    const usable = allSpells.filter((spell: any) => {
        const level = typeof spell?.level === "number" ? spell.level : -1;
        if (level < 0 || level > 9) return false;
        const levelKey = (
            level === 0 ? "cantrip" : String(level)
        ) as keyof typeof SPELL_LEVEL_TO_RARITY;
        const rarityLower = SPELL_LEVEL_TO_RARITY[levelKey];
        const rarityKey = LOWER_TO_TITLE_RARITY[rarityLower];
        return (rarityDistribution?.[rarityKey] ?? 0) > 0;
    });

    const scrolls: any[] = [];
    const components: any[] = [];

    if (includeScrolls) {
        // Select a reasonable subset weighted by distribution
        const target = Math.max(0, Math.round(Math.min(usable.length, 12)));
        const sampled = takeByRarity(
            usable,
            rarityDistribution,
            target,
            (s) => {
                const level = typeof s?.level === "number" ? s.level : 0;
                const levelKey = (
                    level === 0 ? "cantrip" : String(level)
                ) as keyof typeof SPELL_LEVEL_TO_RARITY;
                const rarityLower = SPELL_LEVEL_TO_RARITY[levelKey];
                const rarityKey = LOWER_TO_TITLE_RARITY[rarityLower];
                return rarityKey;
            }
        );

        for (const s of sampled) {
            const level = typeof s?.level === "number" ? s.level : 0;
            const price = priceScroll(level);
            const rarityLower =
                SPELL_LEVEL_TO_RARITY[
                    (level === 0
                        ? "cantrip"
                        : String(level)) as keyof typeof SPELL_LEVEL_TO_RARITY
                ];
            scrolls.push({
                spellId: s.dndbeyondId ?? s.id ?? s.slug ?? s.name,
                name: s.name,
                level,
                rarity: LOWER_TO_TITLE_RARITY[rarityLower],
                priceGp: price,
                type: "scroll",
                url: s.url,
            });
        }
    }

    if (includeComponents) {
        // Extract and aggregate material components with gp values
        const tokens = new Map<string, number>();
        for (const s of usable) {
            const mc = String(s?.materialComponents ?? "");
            const parsed = parseMaterialComponent(mc);
            if (parsed && parsed.priceGp > 0) {
                const key = parsed.name.toLowerCase();
                tokens.set(key, Math.max(tokens.get(key) ?? 0, parsed.priceGp));
            }
        }
        const entries = Array.from(tokens.entries())
            .slice(0, 20)
            .map(([k, v]) => ({ name: k, unit: "each", priceGp: v }));
        components.push(...entries);
    }

    if (process.env.VV_DEBUG) {
        console.log("Magic Shop Spells Calculated Params:", {
            allSpellsLength: allSpells.length,
            usableSpellsLength: usable.length,
            scrolls: scrolls.length,
            components: components.length,
        });
    }

    return { scrolls, components };
}

async function generateItems(
    options: any,
    rarityDistribution: any
): Promise<any[]> {
    const { population, stockMultiplier, wealth, settings } = options;

    const itemCount = calculateItemCount(population, stockMultiplier, settings);
    const priceModifier = calculatePriceModifiers(wealth, settings);
    const prices = calculatePrices(priceModifier);
    const itemsData = await dbServer.query({ dnd5e_magicItems: {} });
    const allItems = itemsData.dnd5e_magicItems as any[];
    const selectedTypes: string[] = Array.isArray(options.stockTypes)
        ? options.stockTypes
        : [];
    const filteredItems = allItems.filter((item: any) => {
        const typeStr =
            typeof item?.type === "string" ? item.type.toLowerCase() : "";
        if (typeStr === "scroll") return false;
        return selectedTypes.includes(typeStr);
    });

    // Where do I get poisons from? https://5e.tools/items.html#wyvern%20poison_xdmg,flsttype:,flstcategory:,flstpoison%20type:ingested=1~injury=1~inhaled=1~contact=1

    // Sample by rarity weight
    const byRarity = groupBy(filteredItems, (it: any) =>
        normalizeRarity(it?.rarity)
    );
    const chosen: any[] = [];

    const rarityKeys = Object.keys(BASE_PRICES) as Array<
        keyof typeof BASE_PRICES
    >;
    let remaining = itemCount;
    for (const rk of rarityKeys) {
        const pool = byRarity.get(rk) ?? [];
        if (!pool.length) continue;
        const weight = clamp01(rarityDistribution?.[rk] ?? 0);
        const target = Math.min(
            pool.length,
            Math.max(0, Math.round(itemCount * weight))
        );
        const take = Math.min(target, remaining);
        const sampled = pickRandom(pool, take);
        chosen.push(...sampled);
        remaining -= sampled.length;
        if (remaining <= 0) break;
    }
    if (remaining > 0) {
        // Fill from any remaining pool
        const seen = new Set<string>();
        for (const c of chosen) {
            const k = keyOf(c as any);
            if (k) seen.add(k);
        }
        const rest = pickRandom(filteredItems, remaining, seen);
        chosen.push(...rest);
    }

    const normalized = chosen.map((item: any) => {
        const rarity = normalizeRarity(
            item?.rarity
        ) as keyof typeof BASE_PRICES;
        const tier = priceTierForType(String(item?.type ?? ""));
        const priceGp = Math.round((prices?.[rarity]?.[tier] ?? 0) * 100) / 100;
        return {
            id: item.dndbeyondId ?? item.id ?? item.slug ?? item.name,
            name: item.name,
            type: item.type,
            rarity,
            priceGp,
            sourceShort: item.sourceShort,
            url: item.url,
        };
    });

    if (process.env.VV_DEBUG) {
        console.log("Magic Shop Items Calculated Params", {
            itemCount,
            priceModifier,
            prices,
            rarityDistribution,
            allItemsLength: allItems.length,
            filteredItemsLength: filteredItems.length,
            chosen: normalized.length,
        });
    }

    return normalized;
}

async function fetchItems(stockTypes: string[]): Promise<any[]> {
    const data = await dbServer.query({
        dnd5e_magicItems: {
            $: {
                where: {
                    type: { $in: stockTypes },
                },
            },
        },
    });
    return data.dnd5e_magicItems;
}

function calculateItemCount(
    population: number,
    stockMultiplier: number,
    settings?: any | null
): number {
    const SLOT_BETA = settings?.slotBeta ?? 0.5;
    const SLOT_SCALE = settings?.slotScale ?? 0.08;
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
    const WEALTH_INFLUENCE = settings?.wealthInfluence ?? 1;
    const MAX_PRICE_CHANGE = settings?.maxPriceChange ?? 0.5;
    const RARITY_PROGRESSION = settings?.rarityProgressionExponent ?? 0.5;
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
    const MAGIC_BIAS = settings?.magicRarityBias ?? 2;
    // <1.0 = gentle shift, >1.0 = aggressive shift toward rare
    const GATING = settings?.rarityPopulationGating ?? "strict";
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

// ------------------------
// Helpers (sampling, rarity, pricing tiers)
// ------------------------

function pickRandom<T>(arr: T[], count: number, seen?: Set<string>): T[] {
    if (!Array.isArray(arr) || arr.length === 0 || count <= 0) return [];
    const copy = arr.slice();
    // Fisher-Yates
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = copy[i];
        copy[i] = copy[j];
        copy[j] = tmp;
    }
    const out: T[] = [];
    const used = seen ?? new Set<string>();
    for (const el of copy) {
        const key = keyOf(el as any);
        if (key && used.has(key)) continue;
        out.push(el);
        if (key) used.add(key);
        if (out.length >= count) break;
    }
    return out;
}

function takeByRarity<T>(
    arr: T[],
    distribution: Record<string, number>,
    total: number,
    rarityOf: (item: T) => string
): T[] {
    const by = groupBy(arr, rarityOf);
    const keys = Object.keys(BASE_PRICES) as Array<keyof typeof BASE_PRICES>;
    const out: T[] = [];
    let remaining = total;
    for (const k of keys) {
        const pool = by.get(k) ?? [];
        if (!pool.length) continue;
        const weight = clamp01(distribution?.[k] ?? 0);
        const want = Math.min(
            pool.length,
            Math.max(0, Math.round(total * weight))
        );
        const take = Math.min(want, remaining);
        out.push(...pickRandom(pool, take));
        remaining -= take;
        if (remaining <= 0) break;
    }
    if (remaining > 0) {
        const seen = new Set<string>();
        for (const o of out) {
            const k = keyOf(o as any);
            if (k) seen.add(k);
        }
        out.push(...pickRandom(arr, remaining, seen));
    }
    return out;
}

function groupBy<T>(arr: T[], keyFn: (t: T) => string): Map<string, T[]> {
    const m = new Map<string, T[]>();
    for (const el of arr) {
        const k = keyFn(el) || "";
        const list = m.get(k) ?? [];
        list.push(el);
        m.set(k, list);
    }
    return m;
}

function normalizeRarity(raw: unknown): keyof typeof BASE_PRICES {
    const s = String(raw || "").toLowerCase();
    if (s === "common") return "Common";
    if (s === "uncommon") return "Uncommon";
    if (s === "rare") return "Rare";
    if (s === "very rare" || s === "very-rare" || s === "very_rare")
        return "Very Rare";
    if (s === "legendary") return "Legendary";
    // fallback
    return "Common";
}

function priceTierForType(type: string): keyof (typeof BASE_PRICES)["Common"] {
    const t = String(type || "").toLowerCase();
    if (["weapon", "armor", "rod", "staff", "wand", "ring"].includes(t))
        return "MAJOR";
    if (["potion", "poison"].includes(t)) return "MINOR";
    if (t === "wondrous item") return "WONDROUS";
    return "NONE";
}

function keyOf(it: any): string | null {
    return it?.dndbeyondId || it?.id || it?.slug || it?.name || null;
}

function clamp01(n: number): number {
    if (!Number.isFinite(n)) return 0;
    if (n < 0) return 0;
    if (n > 1) return 1;
    return n;
}

function priceScroll(level: number): number {
    const key = (
        level === 0 ? "cantrip" : String(level)
    ) as keyof typeof SPELL_SCROLL_PRICES_GP;
    return SPELL_SCROLL_PRICES_GP[key] ?? 0;
}

function parseMaterialComponent(
    s: string
): { name: string; priceGp: number } | null {
    const str = String(s || "");
    if (!str) return null;
    // e.g., "a diamond worth at least 300 gp"
    const m = str.match(
        /worth\s+at\s+least\s+(\d+[\d,]*)\s*gp|worth\s+(\d+[\d,]*)\s*gp|(\d+[\d,]*)\s*gp/i
    );
    if (!m) return null;
    const numStr = (m[1] || m[2] || m[3] || "").replace(/,/g, "");
    const price = Number(numStr);
    if (!Number.isFinite(price) || price <= 0) return null;
    // take a token-ish name before "worth"
    const nameMatch = str.match(/([A-Za-z][A-Za-z'\-\s]{2,})\s+worth/i);
    const name = (nameMatch?.[1] || "Material Component").trim();
    return { name, priceGp: Math.round(price * 100) / 100 };
}
