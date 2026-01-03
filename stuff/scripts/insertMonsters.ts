/** @format */
// stuff\scripts\insertMonsters.ts

import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { init, lookup, id } from "@instantdb/admin";
import { parseCR } from "./helpers";
import _schema from "@/instant.schema";

const db = init({
    appId: "319a811a-4789-48f2-a393-ad5010eb0386",
    adminToken: "4d5c6cb0-1f4f-4a70-a5de-e4bf3741201f",
    schema: _schema,
});

const DATA_DIR = path.resolve(process.cwd(), "stuff", "data");
const FIVEETOOLS_DIR = path.join(DATA_DIR, "5etools", "monsters");

const FILES = {
    monstersData: path.join(DATA_DIR, "dndbeyond-monsters-data.csv"),
    monstersUrls: path.join(DATA_DIR, "dndbeyond-monsters-urls.csv"),
    xphb: path.join(FIVEETOOLS_DIR, "bestiary-xphb.json"),
    xmm: path.join(FIVEETOOLS_DIR, "bestiary-xmm.json"),
    xdmg: path.join(FIVEETOOLS_DIR, "bestiary-xdmg.json"),
};

// Biome list from README.md
const BIOMES = [
    "boreal forests/taiga",
    "deserts & xeric shrublands",
    "flooded grasslands & savannas",
    "mangroves",
    "Mediterranean forests, woodlands, & scrub",
    "montane grasslands & shrublands",
    "rock and ice",
    "temperate broadleaf & mixed forests",
    "temperate conifer forests",
    "temperate grasslands, savannas & shrublands",
    "Tropical & Subtropical Coniferous Forests",
    "Tropical & Subtropical Dry Broadleaf Forests",
    "Tropical & Subtropical Grasslands, Savannas & Shrublands",
    "Tropical & Subtropical Moist Broadleaf Forests",
    "Tundra",
] as const;

type Rec = Record<string, string>;

interface FiveEToolsMonster {
    name: string;
    source: string;
    size?: string[];
    type?: string;
    alignment?: string[];
    speed?: {
        walk?: number;
        fly?: number | { number: number; condition?: string };
        swim?: number;
        climb?: number;
        burrow?: number;
        hover?: boolean;
        canHover?: boolean;
    };
    cr?: string;
    [key: string]: any;
}

function fileExists(filePath: string): boolean {
    try {
        fs.accessSync(filePath, fs.constants.R_OK);
        return true;
    } catch {
        return false;
    }
}

function readCsv(filePath: string): Rec[] {
    const csv = fs.readFileSync(filePath, "utf8");
    return parse(csv, { columns: true, skip_empty_lines: true }) as Rec[];
}

function readJson(filePath: string): any {
    const content = fs.readFileSync(filePath, "utf8");
    return JSON.parse(content);
}

function isNonEmpty(value: unknown): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === "string") return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return true;
}

function omitEmpty<T extends Record<string, unknown>>(obj: T): Partial<T> {
    const out: Partial<T> = {};
    for (const [k, v] of Object.entries(obj)) {
        if (isNonEmpty(v)) {
            // @ts-expect-error index
            out[k] = typeof v === "string" ? v.trim() : v;
        }
    }
    return out;
}

function stripOuterQuotes(s?: string): string | undefined {
    if (!s) return undefined;
    const t = s.trim();
    const isQuoted =
        (t.startsWith('"') && t.endsWith('"')) ||
        (t.startsWith("'") && t.endsWith("'"));
    return isQuoted ? t.slice(1, -1) : t;
}

function normalizeName(name: string): string {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, " ");
}

function isLookupValidation(err: any): boolean {
    const msg: string = err?.body?.message || err?.message || String(err || "");
    const dtype = err?.body?.hint?.["data-type"];
    return (
        dtype === "lookup" ||
        msg.includes(
            "Updates with lookups can only update the lookup attribute"
        )
    );
}

function isUniqueViolation(err: any): boolean {
    const msg: string = err?.body?.message || err?.message || String(err || "");
    return /unique/i.test(msg) || /constraint/i.test(msg);
}

async function upsertRow(
    dndId: string,
    updatePayload: Record<string, any>,
    createPayload: Record<string, any>
) {
    // 1) Try update via lookup (do NOT include dndbeyondId here)
    try {
        const tx = (db.tx as any).dnd5e_bestiary[
            lookup("dndbeyondId", dndId)
        ].update(updatePayload);
        await db.transact([tx]);
        return;
    } catch (err: any) {
        // 2) Fallback to create with random id, including dndbeyondId
        if (!isLookupValidation(err)) {
            // Not a lookup auto-create limitation; bubble up
            throw err;
        }
        try {
            const tx = (db.tx as any).dnd5e_bestiary[id()].create(
                createPayload
            );
            await db.transact([tx]);
            return;
        } catch (err2: any) {
            // 3) If create hit a unique race, retry update
            if (isUniqueViolation(err2)) {
                const tx = (db.tx as any).dnd5e_bestiary[
                    lookup("dndbeyondId", dndId)
                ].update(updatePayload);
                await db.transact([tx]);
                return;
            }
            throw err2;
        }
    }
}

// ============================================================================
// DATA TRANSFORMATION FUNCTIONS
// ============================================================================

/**
 * Extract travelMedium array from 5etools speed data.
 * Returns array of "land", "water", "air" based on available speeds.
 */
function getTravelMediumFromSpeed(
    speed?: FiveEToolsMonster["speed"]
): string[] {
    const mediums: string[] = [];

    if (!speed) {
        // Default to land if no speed data
        return ["land"];
    }

    // Check for walk, climb, or burrow (land movement)
    if (
        speed.walk !== undefined ||
        speed.climb !== undefined ||
        speed.burrow !== undefined
    ) {
        mediums.push("land");
    }

    // Check for swim (water movement)
    if (speed.swim !== undefined) {
        mediums.push("water");
    }

    // Check for fly (air movement) - can be number or object with number property
    if (speed.fly !== undefined) {
        mediums.push("air");
    }

    // If no movement types found, default to land
    if (mediums.length === 0) {
        mediums.push("land");
    }

    return mediums;
}

/**
 * Convert D&D habitat string to biome array.
 * Maps common D&D habitats to appropriate biomes.
 */
function habitatToBiomes(habitat?: string): string[] {
    if (!habitat) return [];

    const habitatLower = habitat.toLowerCase();
    const biomes: string[] = [];

    // Arctic / Tundra
    if (habitatLower.includes("arctic") || habitatLower.includes("tundra")) {
        biomes.push("Tundra");
        biomes.push("rock and ice");
    }

    // Desert
    if (habitatLower.includes("desert")) {
        biomes.push("deserts & xeric shrublands");
    }

    // Forest
    if (habitatLower.includes("forest")) {
        biomes.push("temperate broadleaf & mixed forests");
        biomes.push("temperate conifer forests");
        biomes.push("Tropical & Subtropical Moist Broadleaf Forests");
        biomes.push("Tropical & Subtropical Dry Broadleaf Forests");
        biomes.push("Tropical & Subtropical Coniferous Forests");
    }

    // Grassland / Plains
    if (
        habitatLower.includes("grassland") ||
        habitatLower.includes("plains") ||
        habitatLower.includes("savanna")
    ) {
        biomes.push("temperate grasslands, savannas & shrublands");
        biomes.push("Tropical & Subtropical Grasslands, Savannas & Shrublands");
        biomes.push("flooded grasslands & savannas");
    }

    // Mountain / Hill
    if (habitatLower.includes("mountain") || habitatLower.includes("hill")) {
        biomes.push("montane grasslands & shrublands");
        biomes.push("rock and ice");
    }

    // Swamp / Marsh
    if (habitatLower.includes("swamp") || habitatLower.includes("marsh")) {
        biomes.push("mangroves");
        biomes.push("flooded grasslands & savannas");
    }

    // Coastal
    if (habitatLower.includes("coastal")) {
        biomes.push("mangroves");
    }

    // Underdark
    if (habitatLower.includes("underdark")) {
        // Underdark creatures can be in various biomes, but typically forest/underground
        biomes.push("temperate broadleaf & mixed forests");
    }

    // Underwater
    if (habitatLower.includes("underwater")) {
        // Aquatic creatures don't map to land biomes, but we'll include coastal/mangrove
        biomes.push("mangroves");
    }

    // Urban
    if (habitatLower.includes("urban")) {
        // Urban can be in any biome, but we'll default to temperate
        biomes.push("temperate broadleaf & mixed forests");
        biomes.push("temperate grasslands, savannas & shrublands");
    }

    // Remove duplicates
    return Array.from(new Set(biomes));
}

/**
 * Convert biome array to D&D habitat string.
 * Creates a habitat string from the biome list.
 */
function biomesToHabitat(biomes: string[]): string | undefined {
    if (biomes.length === 0) return undefined;

    // If we have multiple biomes, combine them
    if (biomes.length === 1) {
        // Map single biome to habitat
        const biome = biomes[0].toLowerCase();
        if (biome.includes("tundra") || biome.includes("rock and ice")) {
            return "Arctic";
        }
        if (biome.includes("desert")) {
            return "Desert";
        }
        if (biome.includes("forest")) {
            return "Forest";
        }
        if (biome.includes("grassland") || biome.includes("savanna")) {
            return "Grassland";
        }
        if (biome.includes("montane") || biome.includes("mountain")) {
            return "Mountain";
        }
        if (biome.includes("mangrove")) {
            return "Swamp";
        }
    }

    // For multiple biomes, create a combined habitat
    const habitats: string[] = [];
    const biomeStr = biomes.join(", ").toLowerCase();

    if (biomeStr.includes("tundra") || biomeStr.includes("rock and ice")) {
        habitats.push("Arctic");
    }
    if (biomeStr.includes("desert")) {
        habitats.push("Desert");
    }
    if (biomeStr.includes("forest")) {
        habitats.push("Forest");
    }
    if (biomeStr.includes("grassland") || biomeStr.includes("savanna")) {
        habitats.push("Grassland");
    }
    if (biomeStr.includes("montane") || biomeStr.includes("mountain")) {
        habitats.push("Mountain");
    }
    if (biomeStr.includes("mangrove") || biomeStr.includes("swamp")) {
        habitats.push("Swamp");
    }

    return habitats.length > 0 ? habitats.join(", ") : undefined;
}

// ============================================================================

async function deleteAllMonsters() {
    console.log("Deleting all monsters...");

    const data = await db.query({ dnd5e_bestiary: {} });
    const monsters = (data as any).dnd5e_bestiary || [];

    if (monsters.length === 0) {
        console.log("No monsters to delete.");
        return;
    }

    console.log(`Found ${monsters.length} monsters to delete.`);

    // Delete in batches of 100
    const batchSize = 100;
    for (let i = 0; i < monsters.length; i += batchSize) {
        const batch = monsters.slice(i, i + batchSize);
        const txs = batch.map((monster: any) =>
            (db.tx as any).dnd5e_bestiary[monster.id].delete()
        );
        await db.transact(txs);
        console.log(
            `Deleted ${Math.min(i + batchSize, monsters.length)}/${
                monsters.length
            }`
        );
    }

    console.log("All monsters deleted.");
}

async function upsertMonsters() {
    // Load 5etools JSON files
    console.log("Loading 5etools monster data...");
    const xphbData = fileExists(FILES.xphb)
        ? readJson(FILES.xphb)
        : { monster: [] };
    const xmmData = fileExists(FILES.xmm)
        ? readJson(FILES.xmm)
        : { monster: [] };
    const xdmgData = fileExists(FILES.xdmg)
        ? readJson(FILES.xdmg)
        : { monster: [] };

    const all5eMonsters: FiveEToolsMonster[] = [
        ...(xphbData.monster || []),
        ...(xmmData.monster || []),
        ...(xdmgData.monster || []),
    ];

    console.log(
        `Found ${all5eMonsters.length} monsters from 5etools (xphb: ${
            xphbData.monster?.length || 0
        }, xmm: ${xmmData.monster?.length || 0}, xdmg: ${
            xdmgData.monster?.length || 0
        })`
    );

    // Load dndbeyond mapping data
    console.log("Loading dndbeyond mapping data...");
    const dndbeyondData = readCsv(FILES.monstersData);
    const dndbeyondUrls = readCsv(FILES.monstersUrls);

    // Create name-to-ID mapping (normalized names for matching)
    const nameToIdMap = new Map<string, string>();
    const idToDataMap = new Map<string, Rec>();

    for (const row of dndbeyondData) {
        const dndId = String(row.ID || "").trim();
        const name = stripOuterQuotes(row.NAME);
        if (dndId && name) {
            const normalized = normalizeName(name);
            nameToIdMap.set(normalized, dndId);
            idToDataMap.set(dndId, row);
        }
    }

    // Create ID-to-URL mapping
    const idToUrlMap = new Map<string, string>();
    for (const row of dndbeyondUrls) {
        const dndId = String(row.ID || "").trim();
        const url = row.URL?.trim();
        if (dndId && url) {
            idToUrlMap.set(dndId, url);
        }
    }

    console.log(`Loaded ${nameToIdMap.size} dndbeyond monsters for mapping`);

    let count = 0;
    let matched = 0;
    let unmatched: string[] = [];

    for (const monster5e of all5eMonsters) {
        const name = monster5e.name;
        if (!name) continue;

        // Try to find matching dndbeyond ID
        const normalized = normalizeName(name);
        const dndId = nameToIdMap.get(normalized);

        if (!dndId) {
            unmatched.push(name);
            continue;
        }

        matched++;
        const dndbeyondRow = idToDataMap.get(dndId);
        if (!dndbeyondRow) continue;

        // Extract data from dndbeyond CSV
        const crText = dndbeyondRow.CR?.trim();
        const dndName = stripOuterQuotes(dndbeyondRow.NAME);
        const type = dndbeyondRow.TYPE;
        const size = dndbeyondRow.SIZE;
        const alignment = dndbeyondRow.ALIGNMENT;
        const habitat = dndbeyondRow.HABITAT;
        const source = dndbeyondRow.SOURCE;
        const url = idToUrlMap.get(dndId) || dndbeyondRow.URL;

        // Extract travelMedium from 5etools speed data
        const travelMedium = getTravelMediumFromSpeed(monster5e.speed);

        // Convert habitat to biomes
        const biomes = habitatToBiomes(habitat);

        // Create habitat from biomes
        const newHabitat = biomesToHabitat(biomes) || habitat;

        // Build final payload
        const monster = omitEmpty({
            dndbeyondId: dndId,
            name: dndName,
            nameLower: dndName?.toLowerCase(),
            slug: dndName?.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            crText,
            cr: parseCR(crText),
            type,
            size,
            alignment,
            habitat: newHabitat,
            biome: biomes.length > 0 ? biomes : undefined,
            travelMedium: travelMedium.length > 0 ? travelMedium : undefined,
            source,
            url,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        try {
            await upsertRow(dndId, monster, monster);
        } catch (err: any) {
            console.error(
                `Failed to insert monster ${name} (${dndId}):`,
                err?.body || err
            );
            throw err;
        }

        count++;
        if (count % 50 === 0) {
            console.log(
                `Inserted ${count}/${all5eMonsters.length} monsters...`
            );
        }
    }

    console.log(`✓ Monsters done. Total: ${count}`);
    if (unmatched.length > 0) {
        console.log(
            `⚠ Warning: ${unmatched.length} monsters from 5etools could not be matched to dndbeyond:`
        );
        console.log(unmatched.slice(0, 20).join(", "));
        if (unmatched.length > 20) {
            console.log(`... and ${unmatched.length - 20} more`);
        }
    }
}

async function main() {
    console.time("total");

    await deleteAllMonsters();
    await upsertMonsters();

    console.timeEnd("total");
}

main().catch((err) => {
    console.error(
        "Fatal:",
        err?.body ? JSON.stringify(err.body, null, 2) : err
    );
    process.exit(1);
});
