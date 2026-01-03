/** @format */
// stuff\scripts\updateMonsters.ts

import fs from "node:fs";
import path from "node:path";
import { init, lookup } from "@instantdb/admin";
import _schema from "@/instant.schema";

const db = init({
    appId: "319a811a-4789-48f2-a393-ad5010eb0386",
    adminToken: "4d5c6cb0-1f4f-4a70-a5de-e4bf3741201f",
    schema: _schema,
});

const DATA_DIR = path.resolve(process.cwd(), "stuff", "data");
const FIVEETOOLS_DIR = path.join(DATA_DIR, "5etools", "monsters");

const FILES = {
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

interface FiveEToolsMonster {
    name: string;
    source?: string;
    environment?: string[];
    speed?: {
        walk?: number;
        fly?: number | { number: number; condition?: string };
        swim?: number;
        climb?: number;
        burrow?: number;
        hover?: boolean;
        canHover?: boolean;
    };
    type?: string;
    trait?: Array<{
        name?: string;
        entries?: string[];
    }>;
    [key: string]: any;
}

function readJson(filePath: string): any {
    if (!fs.existsSync(filePath)) {
        return { monster: [] };
    }
    const content = fs.readFileSync(filePath, "utf8");
    return JSON.parse(content);
}

function normalizeName(name: string): string {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, " ");
}

// ============================================================================
// MAPPING FUNCTIONS
// ============================================================================

/**
 * Map 5etools environment array to D&D habitat and biome array.
 * Priority 1: Use environment field from 5etools.
 */
function environmentToHabitatAndBiomes(
    environment?: string[]
): { habitat: string | undefined; biomes: string[] } {
    if (!environment || environment.length === 0) {
        return { habitat: undefined, biomes: [] };
    }

    const biomes: string[] = [];
    const habitats: string[] = [];

    for (const env of environment) {
        const envLower = env.toLowerCase();

        // Arctic / Tundra
        if (envLower.includes("arctic") || envLower.includes("tundra")) {
            habitats.push("Arctic");
            biomes.push("Tundra", "rock and ice");
        }
        // Desert
        else if (envLower.includes("desert")) {
            habitats.push("Desert");
            biomes.push("deserts & xeric shrublands");
        }
        // Forest
        else if (envLower.includes("forest")) {
            habitats.push("Forest");
            biomes.push(
                "temperate broadleaf & mixed forests",
                "temperate conifer forests",
                "Tropical & Subtropical Moist Broadleaf Forests",
                "Tropical & Subtropical Dry Broadleaf Forests",
                "Tropical & Subtropical Coniferous Forests"
            );
        }
        // Grassland / Plains
        else if (
            envLower.includes("grassland") ||
            envLower.includes("plains")
        ) {
            habitats.push("Grassland");
            biomes.push(
                "temperate grasslands, savannas & shrublands",
                "Tropical & Subtropical Grasslands, Savannas & Shrublands",
                "flooded grasslands & savannas"
            );
        }
        // Mountain / Hill
        else if (envLower.includes("mountain") || envLower.includes("hill")) {
            habitats.push("Mountain");
            biomes.push("montane grasslands & shrublands", "rock and ice");
        }
        // Swamp / Marsh
        else if (envLower.includes("swamp") || envLower.includes("marsh")) {
            habitats.push("Swamp");
            biomes.push("mangroves", "flooded grasslands & savannas");
        }
        // Coastal
        else if (envLower.includes("coastal")) {
            habitats.push("Coastal");
            biomes.push("mangroves");
        }
        // Underdark
        else if (envLower.includes("underdark")) {
            habitats.push("Underdark");
            biomes.push("temperate broadleaf & mixed forests");
        }
        // Underwater
        else if (envLower.includes("underwater")) {
            habitats.push("Underwater");
            biomes.push("mangroves");
        }
        // Urban
        else if (envLower.includes("urban")) {
            habitats.push("Urban");
            biomes.push(
                "temperate broadleaf & mixed forests",
                "temperate grasslands, savannas & shrublands"
            );
        }
        // Planar (Air)
        else if (envLower.includes("planar") && envLower.includes("air")) {
            habitats.push("Planar (Elemental Plane of Air)");
            biomes.push("montane grasslands & shrublands");
        }
        // Planar (other)
        else if (envLower.includes("planar")) {
            habitats.push("Planar");
            // Planar creatures could be in various biomes, default to temperate
            biomes.push("temperate broadleaf & mixed forests");
        }
        // Any
        else if (envLower.includes("any")) {
            // "Any" means they can be in multiple habitats
            habitats.push("Any");
            biomes.push(
                "temperate broadleaf & mixed forests",
                "temperate grasslands, savannas & shrublands"
            );
        }
    }

    // Remove duplicates
    const uniqueBiomes = Array.from(new Set(biomes));
    const uniqueHabitats = Array.from(new Set(habitats));

    return {
        habitat: uniqueHabitats.length > 0 ? uniqueHabitats.join(", ") : undefined,
        biomes: uniqueBiomes,
    };
}

/**
 * Infer habitat and biomes from speed data.
 * Priority 2: Infer from speed.
 */
function inferFromSpeed(
    speed?: FiveEToolsMonster["speed"]
): { habitat: string | undefined; biomes: string[] } {
    if (!speed) {
        return { habitat: undefined, biomes: [] };
    }

    const biomes: string[] = [];
    const habitats: string[] = [];

    // Swim speed suggests aquatic/coastal
    if (speed.swim !== undefined) {
        habitats.push("Underwater", "Coastal");
        biomes.push("mangroves");
    }

    // Burrow speed suggests underground
    if (speed.burrow !== undefined) {
        habitats.push("Underdark");
        biomes.push("temperate broadleaf & mixed forests");
    }

    // Fly speed (especially high) might suggest mountain/air
    if (speed.fly !== undefined) {
        const flySpeed =
            typeof speed.fly === "number" ? speed.fly : speed.fly.number;
        if (flySpeed >= 60) {
            // High fly speed suggests mountain/air environments
            habitats.push("Mountain");
            biomes.push("montane grasslands & shrublands");
        }
    }

    // Remove duplicates
    const uniqueBiomes = Array.from(new Set(biomes));
    const uniqueHabitats = Array.from(new Set(habitats));

    return {
        habitat: uniqueHabitats.length > 0 ? uniqueHabitats.join(", ") : undefined,
        biomes: uniqueBiomes,
    };
}

/**
 * Infer habitat and biomes from monster type.
 * Priority 3: Infer from type.
 */
function inferFromType(
    type?: string
): { habitat: string | undefined; biomes: string[] } {
    if (!type) {
        return { habitat: undefined, biomes: [] };
    }

    const typeLower = type.toLowerCase();
    const biomes: string[] = [];
    const habitats: string[] = [];

    // Elemental types often suggest planar or specific environments
    if (typeLower.includes("elemental")) {
        if (typeLower.includes("water") || typeLower.includes("aquatic")) {
            habitats.push("Underwater", "Coastal");
            biomes.push("mangroves");
        } else if (typeLower.includes("fire")) {
            habitats.push("Desert");
            biomes.push("deserts & xeric shrublands");
        } else if (typeLower.includes("air")) {
            habitats.push("Mountain");
            biomes.push("montane grasslands & shrublands");
        } else if (typeLower.includes("earth")) {
            habitats.push("Underdark");
            biomes.push("temperate broadleaf & mixed forests");
        }
    }
    // Plant types suggest forest/swamp
    else if (typeLower.includes("plant")) {
        habitats.push("Forest", "Swamp");
        biomes.push(
            "temperate broadleaf & mixed forests",
            "Tropical & Subtropical Moist Broadleaf Forests",
            "mangroves"
        );
    }
    // Dragon types often suggest mountain/cave
    else if (typeLower.includes("dragon")) {
        habitats.push("Mountain");
        biomes.push("montane grasslands & shrublands", "rock and ice");
    }
    // Beast types are variable, but default to forest/grassland
    else if (typeLower.includes("beast")) {
        habitats.push("Forest", "Grassland");
        biomes.push(
            "temperate broadleaf & mixed forests",
            "temperate grasslands, savannas & shrublands"
        );
    }

    // Remove duplicates
    const uniqueBiomes = Array.from(new Set(biomes));
    const uniqueHabitats = Array.from(new Set(habitats));

    return {
        habitat: uniqueHabitats.length > 0 ? uniqueHabitats.join(", ") : undefined,
        biomes: uniqueBiomes,
    };
}

/**
 * Infer habitat and biomes from traits/abilities.
 * Priority 4: Infer from traits.
 */
function inferFromTraits(
    traits?: Array<{ name?: string; entries?: string[] }>,
    name?: string
): { habitat: string | undefined; biomes: string[] } {
    const biomes: string[] = [];
    const habitats: string[] = [];

    // Check name for keywords
    const nameLower = (name || "").toLowerCase();
    if (nameLower.includes("water") || nameLower.includes("aquatic") || nameLower.includes("sea") || nameLower.includes("ocean")) {
        habitats.push("Underwater", "Coastal");
        biomes.push("mangroves");
    } else if (nameLower.includes("ice") || nameLower.includes("frost") || nameLower.includes("cold")) {
        habitats.push("Arctic");
        biomes.push("Tundra", "rock and ice");
    } else if (nameLower.includes("forest") || nameLower.includes("wood") || nameLower.includes("tree")) {
        habitats.push("Forest");
        biomes.push("temperate broadleaf & mixed forests", "Tropical & Subtropical Moist Broadleaf Forests");
    } else if (nameLower.includes("swamp") || nameLower.includes("bog") || nameLower.includes("marsh")) {
        habitats.push("Swamp");
        biomes.push("mangroves", "flooded grasslands & savannas");
    } else if (nameLower.includes("mountain") || nameLower.includes("hill") || nameLower.includes("peak")) {
        habitats.push("Mountain");
        biomes.push("montane grasslands & shrublands", "rock and ice");
    } else if (nameLower.includes("underground") || nameLower.includes("cave") || nameLower.includes("deep")) {
        habitats.push("Underdark");
        biomes.push("temperate broadleaf & mixed forests");
    } else if (nameLower.includes("desert") || nameLower.includes("sand")) {
        habitats.push("Desert");
        biomes.push("deserts & xeric shrublands");
    }

    // Check traits
    if (traits) {
        for (const trait of traits) {
            const traitName = (trait.name || "").toLowerCase();
            const traitText = (trait.entries || []).join(" ").toLowerCase();

            // Amphibious suggests water + land
            if (traitName.includes("amphibious") || traitText.includes("amphibious")) {
                habitats.push("Coastal", "Swamp");
                biomes.push("mangroves", "flooded grasslands & savannas");
            }
            // Water breathing suggests aquatic
            if (traitName.includes("water breathing") || traitText.includes("water breathing") || traitText.includes("breathe water")) {
                habitats.push("Underwater");
                biomes.push("mangroves");
            }
            // Fire immunity might suggest desert/volcanic
            if (traitText.includes("fire immunity") || traitText.includes("immune to fire")) {
                habitats.push("Desert");
                biomes.push("deserts & xeric shrublands");
            }
            // Cold immunity might suggest arctic
            if (traitText.includes("cold immunity") || traitText.includes("immune to cold")) {
                habitats.push("Arctic");
                biomes.push("Tundra", "rock and ice");
            }
        }
    }

    // Remove duplicates
    const uniqueBiomes = Array.from(new Set(biomes));
    const uniqueHabitats = Array.from(new Set(habitats));

    return {
        habitat: uniqueHabitats.length > 0 ? uniqueHabitats.join(", ") : undefined,
        biomes: uniqueBiomes,
    };
}

/**
 * Convert existing habitat string to biomes.
 * Priority 5: Use existing habitat if available.
 */
function habitatToBiomes(habitat?: string): string[] {
    if (!habitat) return [];

    const habitatLower = habitat.toLowerCase();
    const biomes: string[] = [];

    // Arctic / Tundra
    if (habitatLower.includes("arctic") || habitatLower.includes("tundra")) {
        biomes.push("Tundra", "rock and ice");
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
        biomes.push("temperate broadleaf & mixed forests");
    }

    // Underwater
    if (habitatLower.includes("underwater")) {
        biomes.push("mangroves");
    }

    // Urban
    if (habitatLower.includes("urban")) {
        biomes.push("temperate broadleaf & mixed forests");
        biomes.push("temperate grasslands, savannas & shrublands");
    }

    // Remove duplicates
    return Array.from(new Set(biomes));
}

/**
 * Main inference function - applies all inference methods in priority order.
 */
function inferHabitatAndBiomes(
    monster5e: FiveEToolsMonster | null,
    existingHabitat?: string,
    existingType?: string
): { habitat: string; biomes: string[] } {
    let habitat: string | undefined = undefined;
    let biomes: string[] = [];

    // Priority 1: Use environment from 5etools
    if (monster5e?.environment && monster5e.environment.length > 0) {
        const result = environmentToHabitatAndBiomes(monster5e.environment);
        if (result.habitat) habitat = result.habitat;
        if (result.biomes.length > 0) biomes = result.biomes;
    }

    // Priority 2: Infer from speed (only if we don't have both yet)
    if (!habitat || biomes.length === 0) {
        const result = inferFromSpeed(monster5e?.speed);
        if (!habitat && result.habitat) habitat = result.habitat;
        if (biomes.length === 0 && result.biomes.length > 0) biomes = result.biomes;
    }

    // Priority 3: Infer from type (only if we don't have both yet)
    if (!habitat || biomes.length === 0) {
        const result = inferFromType(monster5e?.type || existingType);
        if (!habitat && result.habitat) habitat = result.habitat;
        if (biomes.length === 0 && result.biomes.length > 0) biomes = result.biomes;
    }

    // Priority 4: Infer from traits/abilities (only if we don't have both yet)
    if (!habitat || biomes.length === 0) {
        const result = inferFromTraits(monster5e?.trait, monster5e?.name);
        if (!habitat && result.habitat) habitat = result.habitat;
        if (biomes.length === 0 && result.biomes.length > 0) biomes = result.biomes;
    }

    // Priority 5: Use existing habitat (only if we don't have both yet)
    if (!habitat || biomes.length === 0) {
        if (existingHabitat) {
            if (!habitat) habitat = existingHabitat;
            if (biomes.length === 0) biomes = habitatToBiomes(existingHabitat);
        }
    }

    // Final fallback: Default to "Any" if still nothing
    if (!habitat) {
        habitat = "Any";
    }
    if (biomes.length === 0) {
        biomes = [
            "temperate broadleaf & mixed forests",
            "temperate grasslands, savannas & shrublands",
        ];
    }

    return { habitat, biomes };
}

// ============================================================================

async function reportMonsterStats() {
    console.log("Fetching all monsters...");

    const data = await db.query({ dnd5e_bestiary: {} });
    const monsters = (data as any).dnd5e_bestiary || [];

    console.log(`Total monsters in database: ${monsters.length}\n`);

    // Count monsters without habitat
    const withoutHabitat = monsters.filter(
        (m: any) => !m.habitat || m.habitat.trim() === ""
    );
    console.log(`Monsters without habitat: ${withoutHabitat.length}`);

    // Count monsters without biome
    const withoutBiome = monsters.filter(
        (m: any) => !m.biome || (Array.isArray(m.biome) && m.biome.length === 0)
    );
    console.log(`Monsters without biome (or empty biome array): ${withoutBiome.length}`);

    // Count monsters without travelMedium
    const withoutTravelMedium = monsters.filter(
        (m: any) =>
            !m.travelMedium ||
            (Array.isArray(m.travelMedium) && m.travelMedium.length === 0)
    );
    console.log(
        `Monsters without travelMedium (or empty travelMedium array): ${withoutTravelMedium.length}`
    );

    // Summary
    console.log("\n=== Summary ===");
    console.log(`Total monsters: ${monsters.length}`);
    console.log(`Without habitat: ${withoutHabitat.length} (${((withoutHabitat.length / monsters.length) * 100).toFixed(1)}%)`);
    console.log(`Without biome: ${withoutBiome.length} (${((withoutBiome.length / monsters.length) * 100).toFixed(1)}%)`);
    console.log(
        `Without travelMedium: ${withoutTravelMedium.length} (${((withoutTravelMedium.length / monsters.length) * 100).toFixed(1)}%)`
    );
}

async function updateMonsters() {
    console.log("Loading 5etools monster data...");
    const xphbData = readJson(FILES.xphb);
    const xmmData = readJson(FILES.xmm);
    const xdmgData = readJson(FILES.xdmg);

    const all5eMonsters: FiveEToolsMonster[] = [
        ...(xphbData.monster || []),
        ...(xmmData.monster || []),
        ...(xdmgData.monster || []),
    ];

    // Create name-to-monster mapping (normalized names)
    const nameToMonsterMap = new Map<string, FiveEToolsMonster>();
    for (const monster of all5eMonsters) {
        if (monster.name) {
            const normalized = normalizeName(monster.name);
            // Keep the first match (or could keep the most recent)
            if (!nameToMonsterMap.has(normalized)) {
                nameToMonsterMap.set(normalized, monster);
            }
        }
    }

    console.log(
        `Loaded ${all5eMonsters.length} monsters from 5etools (xphb: ${xphbData.monster?.length || 0}, xmm: ${xmmData.monster?.length || 0}, xdmg: ${xdmgData.monster?.length || 0})`
    );
    console.log(`Created mapping for ${nameToMonsterMap.size} unique monster names\n`);

    // Fetch all monsters from database
    console.log("Fetching monsters from database...");
    const data = await db.query({ dnd5e_bestiary: {} });
    const monsters = (data as any).dnd5e_bestiary || [];
    console.log(`Found ${monsters.length} monsters in database\n`);

    let updated = 0;
    let skipped = 0;
    let needsUpdate: any[] = [];

    for (const monster of monsters) {
        const needsHabitat = !monster.habitat || monster.habitat.trim() === "";
        const needsBiome =
            !monster.biome || (Array.isArray(monster.biome) && monster.biome.length === 0);

        if (!needsHabitat && !needsBiome) {
            skipped++;
            continue;
        }

        // Try to find matching 5etools monster
        const normalized = normalizeName(monster.name || "");
        const monster5e = nameToMonsterMap.get(normalized) || null;

        // Infer habitat and biomes
        const { habitat, biomes } = inferHabitatAndBiomes(
            monster5e,
            monster.habitat,
            monster.type
        );

        // Prepare update
        const update: any = {};
        if (needsHabitat) {
            update.habitat = habitat;
        }
        if (needsBiome) {
            update.biome = biomes;
        }
        update.updatedAt = new Date();

        try {
            const tx = (db.tx as any).dnd5e_bestiary[
                lookup("dndbeyondId", monster.dndbeyondId)
            ].update(update);
            await db.transact([tx]);
            updated++;

            if (updated % 50 === 0) {
                console.log(`Updated ${updated} monsters...`);
            }
        } catch (err: any) {
            console.error(
                `Failed to update monster ${monster.name} (${monster.dndbeyondId}):`,
                err?.body || err
            );
            needsUpdate.push({
                name: monster.name,
                id: monster.dndbeyondId,
                error: err?.body || err,
            });
        }
    }

    console.log(`\n✓ Update complete!`);
    console.log(`  Updated: ${updated}`);
    console.log(`  Skipped (already complete): ${skipped}`);
    if (needsUpdate.length > 0) {
        console.log(`  Failed: ${needsUpdate.length}`);
    }
}

async function main() {
    const args = process.argv.slice(2);
    const command = args[0] || "report";

    if (command === "update") {
        console.time("update");
        await updateMonsters();
        console.timeEnd("update");
    } else {
        console.time("report");
        await reportMonsterStats();
        console.timeEnd("report");
    }
}

main().catch((err) => {
    console.error(
        "Fatal:",
        err?.body ? JSON.stringify(err.body, null, 2) : err
    );
    process.exit(1);
});
