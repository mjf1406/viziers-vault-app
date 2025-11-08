/** @format */

import type {
    Biome,
    TravelPace,
    Road,
    Time,
} from "@/app/(app)/app/encounter-generator/_constants/encounters";
import {
    ENCOUNTER_PROBABILITIES,
    ROAD_MODIFIERS,
    PACE_MODIFIERS,
} from "@/app/(app)/app/encounter-generator/_constants/encounters";

// Calculate encounter probabilities for a single instance
export function calculateEncounterProbabilities(
    biome: Biome | null,
    timeOfDay: Time | "random" | null,
    road: Road | "random" | null,
    travelPace: TravelPace | "random" | null,
    settings?: any
): {
    nonCombatProb: number;
    combatProb: number;
    hazardProb: number;
    totalProb: number;
} {
    const time = timeOfDay === "random" ? null : timeOfDay ?? "day";
    const timeKey = (time ?? "day") as "day" | "night";
    const biomeKey = biome;

    // Get probability tables from settings or use defaults
    const encounterProbabilities =
        settings?.encounterProbabilities ?? ENCOUNTER_PROBABILITIES;
    const roadModifiers = settings?.roadModifiers ?? ROAD_MODIFIERS;
    const paceModifiers = settings?.paceModifiers ?? PACE_MODIFIERS;

    // Get base probabilities
    const biomeProbs =
        encounterProbabilities[biomeKey as keyof typeof encounterProbabilities];
    const baseProb = biomeProbs?.[timeKey];

    if (!baseProb) {
        return {
            nonCombatProb: 0,
            combatProb: 0,
            hazardProb: 0,
            totalProb: 0,
        };
    }

    // Get modifiers
    const roadModData = roadModifiers[road as keyof typeof roadModifiers];
    const roadMod = roadModData?.[timeKey];

    const paceModData = paceModifiers[travelPace as keyof typeof paceModifiers];
    const paceMod = paceModData?.[timeKey];

    const roadCombatMod = roadMod?.combat ?? 0;
    const roadNonCombatMod = roadMod?.non_combat ?? 0;
    const roadHazardMod = roadMod?.hazard ?? 0;

    const paceCombatMod = paceMod?.combat ?? 0;
    const paceNonCombatMod = paceMod?.non_combat ?? 0;
    const paceHazardMod = paceMod?.hazard ?? 0;

    // Calculate final probabilities
    let combatProb = baseProb.combat;
    let nonCombatProb = baseProb.non_combat;
    let hazardProb = baseProb.hazard;

    // Apply modifiers (relative if percent_type is 0)
    const roadPercentType = roadMod?.percent_type ?? 0;
    const pacePercentType = paceMod?.percent_type ?? 0;

    if (roadPercentType === 0) {
        // Relative modifiers
        combatProb = combatProb + combatProb * roadCombatMod;
        nonCombatProb = nonCombatProb + nonCombatProb * roadNonCombatMod;
        hazardProb = hazardProb + hazardProb * roadHazardMod;
    } else {
        // Absolute modifiers
        combatProb = combatProb + roadCombatMod;
        nonCombatProb = nonCombatProb + roadNonCombatMod;
        hazardProb = hazardProb + roadHazardMod;
    }

    if (pacePercentType === 0) {
        // Relative modifiers
        combatProb = combatProb + combatProb * paceCombatMod;
        nonCombatProb = nonCombatProb + nonCombatProb * paceNonCombatMod;
        hazardProb = hazardProb + hazardProb * paceHazardMod;
    } else {
        // Absolute modifiers
        combatProb = combatProb + paceCombatMod;
        nonCombatProb = nonCombatProb + paceNonCombatMod;
        hazardProb = hazardProb + paceHazardMod;
    }

    // Clamp probabilities between 0 and 1
    combatProb = Math.max(0, Math.min(1, combatProb));
    nonCombatProb = Math.max(0, Math.min(1, nonCombatProb));
    hazardProb = Math.max(0, Math.min(1, hazardProb));

    const totalProb = combatProb + nonCombatProb + hazardProb;

    return {
        nonCombatProb,
        combatProb,
        hazardProb,
        totalProb: Math.min(1, totalProb), // Total can't exceed 1
    };
}

// Calculate probability of at least k successes in n trials with success probability p
// This is the cumulative probability: P(X >= k) where X ~ Binomial(n, p)
export function calcProbAtLeast(
    successProb: number,
    k: number,
    n: number
): number {
    if (k > n) return 0;
    if (k <= 0) return 1;
    if (successProb <= 0) return 0;
    if (successProb >= 1) return 1;

    // Use binomial distribution: P(X >= k) = 1 - P(X < k)
    // P(X < k) = sum from i=0 to k-1 of C(n,i) * p^i * (1-p)^(n-i)
    let prob = 0;
    for (let i = 0; i < k; i++) {
        const comb = binomialCoefficient(n, i);
        prob +=
            comb * Math.pow(successProb, i) * Math.pow(1 - successProb, n - i);
    }
    return 1 - prob;
}

// Calculate binomial coefficient C(n, k) = n! / (k! * (n-k)!)
function binomialCoefficient(n: number, k: number): number {
    if (k > n - k) k = n - k; // Take advantage of symmetry
    let result = 1;
    for (let i = 0; i < k; i++) {
        result = (result * (n - i)) / (i + 1);
    }
    return result;
}

// Calculate probability distribution for encounter counts
export function calculateEncounterProbabilityDistribution(
    instances: Array<{
        biome: Biome | null;
        time: Time | "random" | null;
        road: Road | "random" | null;
        travelPace: TravelPace | "random" | null;
        quantity: number;
    }>,
    settings?: any
): {
    cumulative: Array<{ count: number; probability: number }>;
    byType: {
        combat: Array<{ count: number; probability: number }>;
        "non-combat": Array<{ count: number; probability: number }>;
        hazard: Array<{ count: number; probability: number }>;
    };
} {
    // Build probability array for all rolls
    const probArray: Array<{
        combatProb: number;
        nonCombatProb: number;
        hazardProb: number;
        totalProb: number;
    }> = [];

    for (const instance of instances) {
        const probs = calculateEncounterProbabilities(
            instance.biome,
            instance.time,
            instance.road,
            instance.travelPace,
            settings
        );

        // Add one entry per quantity
        for (let i = 0; i < (instance.quantity ?? 1); i++) {
            probArray.push({
                combatProb: probs.combatProb,
                nonCombatProb: probs.nonCombatProb,
                hazardProb: probs.hazardProb,
                totalProb: probs.totalProb,
            });
        }
    }

    const totalRolls = probArray.length;
    if (totalRolls === 0) {
        return {
            cumulative: [{ count: 0, probability: 1 }],
            byType: {
                combat: [{ count: 0, probability: 1 }],
                "non-combat": [{ count: 0, probability: 1 }],
                hazard: [{ count: 0, probability: 1 }],
            },
        };
    }

    // Calculate average probabilities
    const avgCombatProb =
        probArray.reduce((sum, p) => sum + p.combatProb, 0) / totalRolls;
    const avgNonCombatProb =
        probArray.reduce((sum, p) => sum + p.nonCombatProb, 0) / totalRolls;
    const avgHazardProb =
        probArray.reduce((sum, p) => sum + p.hazardProb, 0) / totalRolls;
    const avgTotalProb =
        probArray.reduce((sum, p) => sum + p.totalProb, 0) / totalRolls;

    // Calculate cumulative probabilities
    // For k=0: show P(X = 0) = (1-p)^n (probability of exactly 0 encounters)
    // For k>=1: show P(X >= k) (probability of at least k encounters)
    const cumulative: Array<{ count: number; probability: number }> = [];
    const maxCount = Math.min(totalRolls, 20); // Cap at 20 for display

    for (let k = 0; k <= maxCount; k++) {
        let prob: number;
        if (k === 0) {
            // P(X = 0) = (1 - p)^n
            prob = Math.pow(1 - avgTotalProb, totalRolls);
        } else {
            // P(X >= k)
            prob = calcProbAtLeast(avgTotalProb, k, totalRolls);
        }
        cumulative.push({ count: k, probability: prob });
    }

    // Calculate by-type probabilities
    const combatProbs: Array<{ count: number; probability: number }> = [];
    const nonCombatProbs: Array<{ count: number; probability: number }> = [];
    const hazardProbs: Array<{ count: number; probability: number }> = [];

    for (let k = 0; k <= maxCount; k++) {
        let combatProb: number;
        let nonCombatProb: number;
        let hazardProb: number;

        if (k === 0) {
            // P(X = 0) = (1 - p)^n
            combatProb = Math.pow(1 - avgCombatProb, totalRolls);
            nonCombatProb = Math.pow(1 - avgNonCombatProb, totalRolls);
            hazardProb = Math.pow(1 - avgHazardProb, totalRolls);
        } else {
            // P(X >= k)
            combatProb = calcProbAtLeast(avgCombatProb, k, totalRolls);
            nonCombatProb = calcProbAtLeast(avgNonCombatProb, k, totalRolls);
            hazardProb = calcProbAtLeast(avgHazardProb, k, totalRolls);
        }

        combatProbs.push({ count: k, probability: combatProb });
        nonCombatProbs.push({ count: k, probability: nonCombatProb });
        hazardProbs.push({ count: k, probability: hazardProb });
    }

    return {
        cumulative,
        byType: {
            combat: combatProbs,
            "non-combat": nonCombatProbs,
            hazard: hazardProbs,
        },
    };
}
