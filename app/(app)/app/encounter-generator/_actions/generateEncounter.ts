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
} from "@/app/(app)/app/encounter-generator/_utils/combat-encounter-helpers";
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
    // TODO: Implement hazard generation
    return {
        type: "hazard",
        difficulty,
        description: "Hazard encounter (not yet implemented)",
    };
}

// Generate non-combat encounter (empty for now)
function generateNonCombat(
    difficulty: string,
    biome: Biome | null,
    options: GenerateEncounterOpts
): any {
    // TODO: Implement non-combat generation
    return {
        type: "non-combat",
        difficulty,
        description: "Non-combat encounter (not yet implemented)",
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

    if (partySize === 1 && averageLevel === 1) {
        return {
            type: "combat",
            difficulty,
            description: "Combat encounter (no party specified)",
            monsters: [],
        };
    }

    const { xpLowerBound, xpUpperBound } = calculateXpBounds(
        averageLevel,
        partySize,
        difficulty
    );
    const habitat = mapBiomeToHabitat(biome);
    const timeOfDay: string | null = options.time === "random" 
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
            };
        }
    } catch (error) {
        console.error("Failed to generate combat encounter:", error);
        return {
            type: "combat",
            difficulty,
            description: "Combat encounter (generation failed)",
            monsters: [],
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

        // GUARANTEED MODE: If specific encounter type AND difficulty are specified,
        // this is from GenerateEncounterDialog - skip probability and generate directly
        // This guarantees the exact quantity of encounters with the specified difficulty
        if (encounterType && options.difficultyLevel) {
            const quantity = options.quantity ?? 1;
            const difficulty = options.difficultyLevel;

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
                    encounter = generateNonCombat(difficulty, biome, options);
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
            });
            continue;
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

        const roadModifier = roadMod
            ? encounterType === "combat"
                ? roadMod.combat
                : encounterType === "non-combat"
                ? roadMod.non_combat
                : roadMod.hazard
            : 0;
        const paceModifier = paceMod
            ? encounterType === "combat"
                ? paceMod.combat
                : encounterType === "non-combat"
                ? paceMod.non_combat
                : paceMod.hazard
            : 0;

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
                if (encounterType === "combat") prob = combatProb;
                else if (encounterType === "non-combat") prob = nonCombatProb;
                else if (encounterType === "hazard") prob = hazardProb;

                if (rollForEncounter(prob)) {
                    // Encounter occurred
                    const difficulty = options.difficultyLevel
                        ? options.difficultyLevel
                        : rollForDifficulty(
                              probTables.difficultyProbabilities,
                              timeKey
                          );

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
                        encounter = generateNonCombat(
                            difficulty,
                            biome,
                            options
                        );
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
                    const difficulty = rollForDifficulty(
                        probTables.difficultyProbabilities,
                        timeKey
                    );
                    const encounter = generateNonCombat(
                        difficulty,
                        biome,
                        options
                    );
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
        });
    }

    // Create a single record with all encounters combined
    const encounterId = id();
    const record: any = {
        createdAt,
        encounterCount: allGeneratedEncounters.length,
        encounters: allGeneratedEncounters,
        options: {
            instances: allOptions,
            quantity: optionsArray.length,
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
