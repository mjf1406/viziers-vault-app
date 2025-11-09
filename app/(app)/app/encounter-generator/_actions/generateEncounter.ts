/** @format */

"use client";

import type { GenerateEncounterOpts } from "../_components/RollEncounterDialog";
import db from "@/lib/db";
import { id, tx } from "@instantdb/react";
import type { Biome } from "@/app/(app)/app/encounter-generator/_constants/encounters";
import {
    ENCOUNTER_PROBABILITIES,
    ROAD_MODIFIERS,
    PACE_MODIFIERS,
    DIFFICULTY_PROBABILITIES,
} from "@/app/(app)/app/encounter-generator/_constants/encounters";
import {
    mapBiomeToHabitat,
    calculateXpBounds,
    filterMonsters,
    getXpFromCr,
    mapBiomeToNonCombatTable,
    rollEncounterDistance,
} from "@/app/(app)/app/encounter-generator/_utils/combat-encounter-helpers";
import {
    arctic_nc,
    carousing_nc,
    coastal_nc,
    desert_nc,
    dungeon_nc,
    farmland_nc,
    festivals_nc,
    forest_nc,
    grassland_nc,
    hill_nc,
    jungle_nc,
    mountain_nc,
    open_water_nc,
    red_light_district_nc,
    road_nc,
    swamp_nc,
    tavern_nc,
    underdark_nc,
    underwater_nc,
    urban_nc,
    wasteland_nc,
    woodland_nc,
    seedy_tavern_nc,
} from "@/app/(app)/app/encounter-generator/_constants/nonCombatEncounters";

// Verify tables are imported correctly (debug only - remove in production if needed)
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    const tables = {
        arctic_nc,
        forest_nc,
        grassland_nc,
        road_nc,
    };
    const emptyTables = Object.entries(tables).filter(
        ([_, table]) => !table || !Array.isArray(table) || table.length === 0
    );
    if (emptyTables.length > 0) {
        console.warn(
            "Some non-combat encounter tables appear to be empty or undefined:",
            emptyTables
        );
    }
}
import {
    getLeader,
    generateLeaderFollowerEncounter,
    generateSimpleEncounter,
    calculatePartyStats,
} from "@/app/(app)/app/encounter-generator/_utils/combat-encounter-generation";
import { calculateEncounterProbabilities } from "@/app/(app)/app/encounter-generator/_utils/encounter-probabilities";

export type GenerateEncounterInput = {
    name?: string | null;
    options: GenerateEncounterOpts | GenerateEncounterOpts[];
    quantity?: number | null;
};

export type GenerateEncounterResponse =
    | string[]
    | {
          encounters: Array<{
              name?: string | null;
              createdAt: Date;
              encounterCount: number;
              encounters: any[];
              options: any;
          }>;
      };

// Get probability tables from settings or use defaults
// Settings are now objects: {[key]: {day: {...}, night: {...}}}
function getProbabilityTables(settings: any) {
    // Use settings if available, otherwise use exported constants
    return {
        encounterProbabilities:
            settings?.encounterProbabilities ?? ENCOUNTER_PROBABILITIES,
        roadModifiers: settings?.roadModifiers ?? ROAD_MODIFIERS,
        paceModifiers: settings?.paceModifiers ?? PACE_MODIFIERS,
        difficultyProbabilities:
            settings?.difficultyProbabilities ?? DIFFICULTY_PROBABILITIES,
    };
}

// Calculate modified encounter probability
function calculateEncounterProbability(
    baseProb: number,
    roadModifier: number,
    paceModifier: number
): number {
    // Apply relative modifiers
    let modified = baseProb;
    modified = modified * (1 + roadModifier);
    modified = modified * (1 + paceModifier);
    return Math.max(0, Math.min(1, modified)); // Clamp between 0 and 1
}

// Roll for encounter occurrence
function rollForEncounter(probability: number): boolean {
    return Math.random() < probability;
}

// Roll for difficulty
// difficultyProbs is now an object: {[difficulty]: {day: prob, night: prob}}
function rollForDifficulty(
    difficultyProbs: Record<string, { day: number; night: number }>,
    time: "day" | "night"
): string {
    if (!difficultyProbs || typeof difficultyProbs !== "object") {
        return "medium"; // Default
    }

    // Get probabilities for the given time
    const probs: Array<{ difficulty: string; probability: number }> = [];
    for (const [difficulty, times] of Object.entries(difficultyProbs)) {
        const prob = times?.[time];
        if (typeof prob === "number" && prob > 0) {
            probs.push({ difficulty, probability: prob });
        }
    }

    if (probs.length === 0) return "medium"; // Default

    const rand = Math.random();
    let cumulative = 0;
    for (const dp of probs) {
        cumulative += dp.probability;
        if (rand < cumulative) {
            return dp.difficulty;
        }
    }
    return probs[probs.length - 1].difficulty; // Fallback to last
}

// Generate hazard encounter (empty for now)
function generateHazard(
    difficulty: string,
    biome: Biome | null,
    options: GenerateEncounterOpts
): any {
    const distance = rollEncounterDistance(biome, options.travelMedium ?? null);
    // TODO: Implement hazard generation
    return {
        type: "hazard",
        difficulty,
        description: "Hazard encounter (not yet implemented)",
        distance,
    };
}

// Helper function to get a random element from an array
function getRandomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
}

// Special case handlers for non-combat encounters
function generateRandomShip(): string {
    // Placeholder for Random Ship generation
    // In the future, this could be expanded with detailed ship generation
    return "The party encounters a random ship on the open water. The ship's purpose, crew, and disposition are left to the DM's discretion.";
}

function generateMysteriousIsland(): string {
    // Placeholder for Mysterious Island generation
    // In the future, this could be expanded with detailed island generation
    return "The party discovers a mysterious island shrouded in fog. The island's theme, inhabitants, and secrets are left to the DM's discretion.";
}

function generateBlueHole(): string {
    // Placeholder for Blue Hole generation
    // In the future, this could be expanded with detailed blue hole generation
    const diameter = Math.floor(Math.random() * 10 + 1) * 100;
    const depth = Math.floor(Math.random() * 10 + 1) * 100;
    return `The party comes across a Blue Hole that is ${diameter}ft in diameter and ${depth}ft deep. The contents and mysteries within are left to the DM's discretion.`;
}

function generateShipwreck(): string {
    // Placeholder for Shipwreck generation
    // In the future, this could be expanded with detailed shipwreck generation
    return "The party discovers a shipwreck. The condition of the wreck, its cargo, and any survivors or dangers are left to the DM's discretion.";
}

// Map table name string to actual table array
function getTableByName(tableName: string | null): string[] | null {
    if (!tableName) return null;

    const tableMap: Record<string, string[]> = {
        arctic_nc,
        carousing_nc,
        coastal_nc,
        desert_nc,
        dungeon_nc,
        farmland_nc,
        festivals_nc,
        forest_nc,
        grassland_nc,
        hill_nc,
        jungle_nc,
        mountain_nc,
        open_water_nc,
        red_light_district_nc,
        road_nc,
        swamp_nc,
        tavern_nc,
        underdark_nc,
        underwater_nc,
        urban_nc,
        wasteland_nc,
        woodland_nc,
        seedy_tavern_nc,
    };

    const table = tableMap[tableName];

    // Debug: Check if table exists and has content
    if (!table) {
        console.error(
            `Table ${tableName} not found in tableMap. Available keys:`,
            Object.keys(tableMap)
        );
    } else if (!Array.isArray(table)) {
        console.error(
            `Table ${tableName} is not an array:`,
            typeof table,
            table
        );
    } else if (table.length === 0) {
        console.warn(`Table ${tableName} is empty`);
    }

    return table || null;
}

// Generate non-combat encounter
function generateNonCombat(
    biome: Biome | null,
    options: GenerateEncounterOpts
): any {
    const road = options.road ?? null;
    const travelMedium = options.travelMedium ?? null;

    // Check if this is a road encounter
    // Road encounters use road_nc table if road is one of: highway, byway, royalway, bridleway
    const isRoadEncounter =
        road &&
        road !== "no road" &&
        road !== "random" &&
        (road === "highway" ||
            road === "byway" ||
            road === "royalway" ||
            road === "bridleway");

    let encounterTable: string[] | null = null;
    let tableName: string | null = null;

    if (isRoadEncounter) {
        // Use road_nc table for road encounters
        encounterTable = road_nc;
        tableName = "road_nc";
    } else if (travelMedium === "sea") {
        // Use open_water_nc table for sea travel
        encounterTable = open_water_nc;
        tableName = "open_water_nc";
    } else {
        // Use biome-specific table
        console.log("Mapping biome to table:", biome);
        tableName = mapBiomeToNonCombatTable(biome);
        console.log("Mapped table name:", tableName);
        encounterTable = getTableByName(tableName);
        console.log(
            "Retrieved table:",
            encounterTable ? `${encounterTable.length} entries` : "null"
        );

        // Fallback to forest_nc if no table found
        if (!encounterTable) {
            console.warn(
                `No table found for biome: ${biome}, tableName: ${tableName}, falling back to forest_nc`
            );
            encounterTable = forest_nc;
            tableName = "forest_nc";
        }
    }

    // Debug logging
    if (!encounterTable) {
        console.error(
            `No encounter table found. biome: ${biome}, road: ${road}, travelMedium: ${travelMedium}, tableName: ${tableName}`
        );
        return {
            type: "non-combat",
            description:
                "Non-combat encounter (no encounters available for this biome)",
            biome: biome ?? null,
            road: isRoadEncounter ? road : null,
        };
    }

    if (encounterTable.length === 0) {
        console.error(
            `Encounter table ${tableName} is empty. biome: ${biome}, road: ${road}`
        );
        return {
            type: "non-combat",
            description:
                "Non-combat encounter (no encounters available for this biome)",
            biome: biome ?? null,
            road: isRoadEncounter ? road : null,
        };
    }

    const selectedEncounter = getRandomElement(encounterTable);

    // Handle special cases
    let description = selectedEncounter;
    if (selectedEncounter === "Random Ship") {
        description = generateRandomShip();
    } else if (selectedEncounter === "Mysterious Island") {
        description = generateMysteriousIsland();
    } else if (selectedEncounter === "Blue Hole") {
        description = generateBlueHole();
    } else if (selectedEncounter === "Shipwreck") {
        description = generateShipwreck();
    }

    const distance = rollEncounterDistance(biome, travelMedium);
    return {
        type: "non-combat",
        description,
        biome: biome ?? null,
        road: isRoadEncounter ? road : null,
        distance,
    };
}

// Generate combat encounter
async function generateCombatEncounter(
    party: { pcs: Array<{ level: number; quantity: number }> } | null,
    difficulty: string,
    biome: Biome | null,
    travelMedium: string | null,
    options: GenerateEncounterOpts,
    allMonsters: any[]
): Promise<any> {
    const { averageLevel, partySize } = calculatePartyStats(party);

    const distance = rollEncounterDistance(biome, travelMedium);
    
    if (partySize === 1 && averageLevel === 1) {
        return {
            type: "combat",
            difficulty,
            description: "Combat encounter (no party specified)",
            monsters: [],
            distance,
        };
    }

    const { xpLowerBound, xpUpperBound } = calculateXpBounds(
        averageLevel,
        partySize,
        difficulty
    );
    const habitat = mapBiomeToHabitat(biome);
    const timeOfDay: string | null =
        options.time === "random"
            ? null
            : (options.time ?? "day").toLowerCase();

    try {
        const filtered = filterMonsters(
            allMonsters,
            xpUpperBound,
            habitat,
            biome,
            timeOfDay,
            travelMedium
        );

        if (filtered.length === 0) {
            return {
                type: "combat",
                difficulty,
                description: "Combat encounter (no suitable monsters found)",
                monsters: [],
                distance,
            };
        }

        const hasRelationshipData = filtered.some(
            (m) =>
                (m.FOLLOWERS &&
                    Array.isArray(m.FOLLOWERS) &&
                    m.FOLLOWERS.length > 0) ||
                (m.LIEUTENANTS &&
                    Array.isArray(m.LIEUTENANTS) &&
                    m.LIEUTENANTS.length > 0) ||
                (m.SERGEANTS &&
                    Array.isArray(m.SERGEANTS) &&
                    m.SERGEANTS.length > 0) ||
                (m.MINIONS && Array.isArray(m.MINIONS) && m.MINIONS.length > 0)
        );

        if (hasRelationshipData) {
            const leader = getLeader(
                filtered,
                Math.floor(averageLevel),
                allMonsters
            );

            if (!leader) {
                const selectedMonster =
                    filtered[Math.floor(Math.random() * filtered.length)];
                return {
                    type: "combat",
                    difficulty,
                    monsters: [
                        {
                            name: selectedMonster.name,
                            cr: selectedMonster.cr,
                            crText: selectedMonster.crText,
                            quantity: 1,
                            url: selectedMonster.url,
                            label: "leader",
                        },
                    ],
                    xpLowerBound,
                    xpUpperBound,
                    adjustedXP: getXpFromCr(selectedMonster.cr),
                    totalXP: getXpFromCr(selectedMonster.cr),
                    xpPerPC: getXpFromCr(selectedMonster.cr) / partySize,
                    numberOfCreatures: 1,
                    distance,
                };
            }

            const result = await generateLeaderFollowerEncounter(
                leader,
                xpLowerBound,
                xpUpperBound,
                partySize,
                allMonsters
            );

            return {
                type: "combat",
                difficulty,
                ...result,
                distance,
            };
        } else {
            console.warn(
                "No relationship data found in monsters, using simple encounter generation"
            );
            const selectedMonster =
                filtered[Math.floor(Math.random() * filtered.length)];
            const result = generateSimpleEncounter(
                selectedMonster,
                xpLowerBound,
                xpUpperBound,
                partySize
            );
            return {
                type: "combat",
                difficulty,
                ...result,
                distance,
            };
        }
    } catch (error) {
        console.error("Failed to generate combat encounter:", error);
        return {
            type: "combat",
            difficulty,
            description: "Combat encounter (generation failed)",
            monsters: [],
            distance,
        };
    }
}

export default async function generateEncounter(
    input: GenerateEncounterInput,
    userId?: string | null,
    settings?: any,
    allMonsters?: any[]
): Promise<GenerateEncounterResponse> {
    const createdAt = new Date();
    const name = input?.name?.trim() || undefined;
    const optionsArray = Array.isArray(input.options)
        ? input.options
        : [input.options];
    const canSave = Boolean(userId);

    console.log("generateEncounter options:", {
        name,
        optionsArray,
        canSave,
        userId,
    });

    // Get probability tables from provided settings
    const probTables = getProbabilityTables(settings);

    // Combine all instances into a single encounter record
    const allGeneratedEncounters: any[] = [];
    const allOptions: any[] = [];

    // Generate encounters for each instance
    for (const options of optionsArray) {
        const biome = options.biome ?? null;
        const time = options.time === "random" ? null : options.time ?? "day";
        const road =
            options.road === "random" ? null : options.road ?? "no road";
        const pace =
            options.travelPace === "random"
                ? null
                : options.travelPace ?? "normal";
        const encounterType = options.encounterType ?? null;
        const party = options.party ?? null;

        // GUARANTEED MODE: If specific encounter type is specified, generate directly
        // For non-combat encounters, difficulty is not needed, so allow generation without difficultyLevel
        // For combat encounters, difficulty is required
        if (encounterType) {
            // For non-combat, always generate directly (no difficulty needed)
            // For combat/hazard, require difficultyLevel
            if (encounterType === "non-combat" || options.difficultyLevel) {
                const quantity = options.quantity ?? 1;
                const difficulty = options.difficultyLevel ?? "medium"; // Default for non-combat

                for (let i = 0; i < quantity; i++) {
                    let encounter: any;
                    if (encounterType === "combat") {
                        encounter = await generateCombatEncounter(
                            party,
                            difficulty,
                            biome,
                            options.travelMedium ?? null,
                            options,
                            allMonsters ?? []
                        );
                    } else if (encounterType === "non-combat") {
                        console.log(
                            "Generating non-combat encounter for biome:",
                            biome
                        );
                        encounter = generateNonCombat(biome, options);
                        console.log("Generated encounter:", encounter);
                    } else {
                        encounter = generateHazard(difficulty, biome, options);
                    }
                    allGeneratedEncounters.push(encounter);
                }

                allOptions.push({
                    biome: options.biome ?? null,
                    travelPace: options.travelPace ?? null,
                    road: options.road ?? null,
                    travelMedium: options.travelMedium ?? null,
                    time: options.time ?? null,
                    season: options.season ?? null,
                    party: options.party ?? null,
                });
                continue;
            }
        }

        // PROBABILITY MODE: This is from RollEncounterDialog - use probability tables
        // Encounters are rolled based on probabilities, may result in 0 encounters
        // Roll quantity times for this instance

        // Use the actual biome (not probability biome) for lookup
        const biomeKey = biome;
        const timeKey = (time ?? "day") as "day" | "night";

        // Get base encounter probability from object structure
        // Structure: {[biome]: {day: {non_combat, combat, hazard, total}, night: {...}}}
        const biomeProbs =
            probTables.encounterProbabilities[
                biomeKey as keyof typeof probTables.encounterProbabilities
            ];
        const baseProb = biomeProbs?.[timeKey];

        if (!baseProb) {
            // No probability found, skip this instance
            allOptions.push({
                biome: options.biome ?? null,
                travelPace: options.travelPace ?? null,
                road: options.road ?? null,
                travelMedium: options.travelMedium ?? null,
                time: options.time ?? null,
                season: options.season ?? null,
            });
            continue;
        }

        // Get modifiers from object structure
        // Structure: {[roadType]: {day: {non_combat, combat, hazard, percent_type}, night: {...}}}
        const roadModData =
            probTables.roadModifiers[
                road as keyof typeof probTables.roadModifiers
            ];
        const roadMod = roadModData?.[timeKey];

        // Structure: {[pace]: {day: {non_combat, combat, hazard, percent_type}, night: {...}}}
        const paceModData =
            probTables.paceModifiers[
                pace as keyof typeof probTables.paceModifiers
            ];
        const paceMod = paceModData?.[timeKey];

        const getRoadModifier = (
            mod: typeof roadMod,
            type: "combat" | "non-combat" | "hazard" | null
        ): number => {
            if (!mod) return 0;
            if (type === "combat") return mod.combat;
            if (type === "non-combat") return mod.non_combat;
            if (type === "hazard") return mod.hazard;
            return 0;
        };

        const getPaceModifier = (
            mod: typeof paceMod,
            type: "combat" | "non-combat" | "hazard" | null
        ): number => {
            if (!mod) return 0;
            if (type === "combat") return mod.combat;
            if (type === "non-combat") return mod.non_combat;
            if (type === "hazard") return mod.hazard;
            return 0;
        };

        const roadModifier = getRoadModifier(roadMod, encounterType);
        const paceModifier = getPaceModifier(paceMod, encounterType);

        // Calculate probability for each encounter type
        const combatProb = calculateEncounterProbability(
            baseProb.combat,
            roadModifier,
            paceModifier
        );
        const nonCombatProb = calculateEncounterProbability(
            baseProb.non_combat,
            roadModifier,
            paceModifier
        );
        const hazardProb = calculateEncounterProbability(
            baseProb.hazard,
            roadModifier,
            paceModifier
        );

        // Get quantity for this instance (default to 1 if not specified)
        const quantity = options.quantity ?? 1;

        // Roll quantity times for this instance
        for (let i = 0; i < quantity; i++) {
            // If specific encounter type requested (but no difficulty), roll for it
            if (encounterType) {
                // Encounter type specified but no difficulty - roll for it
                let prob = 0;
                const type = encounterType as
                    | "combat"
                    | "non-combat"
                    | "hazard";
                if (type === "combat") {
                    prob = combatProb;
                } else if (type === "non-combat") {
                    prob = nonCombatProb;
                } else if (type === "hazard") {
                    prob = hazardProb;
                }

                if (rollForEncounter(prob)) {
                    // Encounter occurred
                    const difficulty = options.difficultyLevel
                        ? options.difficultyLevel
                        : rollForDifficulty(
                              probTables.difficultyProbabilities,
                              timeKey
                          );

                    let encounter: any;
                    const encounterTypeChecked = encounterType as
                        | "combat"
                        | "non-combat"
                        | "hazard";
                    if (encounterTypeChecked === "combat") {
                        encounter = await generateCombatEncounter(
                            party,
                            difficulty,
                            biome,
                            options.travelMedium ?? null,
                            options,
                            allMonsters ?? []
                        );
                    } else if (encounterTypeChecked === "non-combat") {
                        encounter = generateNonCombat(biome, options);
                    } else {
                        encounter = generateHazard(difficulty, biome, options);
                    }
                    allGeneratedEncounters.push(encounter);
                }
            } else {
                // Roll for all types
                if (rollForEncounter(combatProb)) {
                    const difficulty = rollForDifficulty(
                        probTables.difficultyProbabilities,
                        timeKey
                    );
                    const encounter = await generateCombatEncounter(
                        party,
                        difficulty,
                        biome,
                        options.travelMedium ?? null,
                        options,
                        allMonsters ?? []
                    );
                    allGeneratedEncounters.push(encounter);
                }
                if (rollForEncounter(nonCombatProb)) {
                    const encounter = generateNonCombat(biome, options);
                    allGeneratedEncounters.push(encounter);
                }
                if (rollForEncounter(hazardProb)) {
                    const difficulty = rollForDifficulty(
                        probTables.difficultyProbabilities,
                        timeKey
                    );
                    const encounter = generateHazard(
                        difficulty,
                        biome,
                        options
                    );
                    allGeneratedEncounters.push(encounter);
                }
            }
        }

        allOptions.push({
            biome: options.biome ?? null,
            travelPace: options.travelPace ?? null,
            road: options.road ?? null,
            travelMedium: options.travelMedium ?? null,
            time: options.time ?? null,
            season: options.season ?? null,
            party: options.party ?? null,
        });
    }

    // Get party info from first instance (assuming all instances use same party)
    const party = optionsArray[0]?.party ?? null;

    // Create a single record with all encounters combined
    const encounterId = id();
    const record: any = {
        createdAt,
        encounterCount: allGeneratedEncounters.length,
        encounters: allGeneratedEncounters,
        options: {
            instances: allOptions,
            quantity: optionsArray.length,
            party: party,
        },
    };

    // Only include name if it's provided
    if (name) {
        record.name = name;
    }

    if (canSave && userId) {
        await db.transact(
            tx.encounters[encounterId].create(record).link({ owner: userId })
        );
        return [encounterId];
    } else {
        return {
            encounters: [
                {
                    name: record.name,
                    createdAt: record.createdAt,
                    encounterCount: record.encounterCount,
                    encounters: record.encounters,
                    options: record.options,
                },
            ],
        };
    }
}
