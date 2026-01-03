/** @format */

import {
    XP_THRESHOLDS,
    ENC_XP_MULTIPLIERS,
    MONSTER_STATS,
} from "@/app/(app)/app/encounter-generator/_constants/encounters";
import type { Biome } from "@/app/(app)/app/encounter-generator/_constants/encounters";
import { oaEncounterDistance } from "@/app/(app)/app/encounter-generator/_constants/combatEncounters";

// Map biome directly to D&D habitat string for monster filtering
export function mapBiomeToHabitat(biome: Biome | null): string | null {
    if (!biome) return null;

    const biomeLower = biome.toLowerCase();

    if (
        biomeLower.includes("tundra") ||
        biomeLower.includes("boreal") ||
        biomeLower.includes("taiga") ||
        biomeLower.includes("rock and ice")
    ) {
        return "Arctic";
    }

    if (biomeLower.includes("desert") || biomeLower.includes("xeric")) {
        return "Desert";
    }

    if (biomeLower.includes("forest")) {
        return "Forest";
    }

    if (
        biomeLower.includes("grassland") ||
        biomeLower.includes("savanna") ||
        biomeLower.includes("savannas")
    ) {
        return "Grassland";
    }

    if (biomeLower.includes("montane") || biomeLower.includes("mountain")) {
        return "Mountain";
    }

    if (biomeLower.includes("mangrove")) {
        return "Swamp";
    }

    if (biomeLower.includes("flooded")) {
        return "Coastal";
    }

    if (biomeLower.includes("mediterranean")) {
        return "Forest";
    }

    return "Forest";
}

// Convert CR to XP value
export function getXpFromCr(cr: number | null | undefined): number {
    if (cr === null || cr === undefined) return 0;

    const stat = MONSTER_STATS.find((s) => {
        if (Math.abs(s.cr - cr) < 0.001) return true;
        if (Math.abs(s.cr_number - cr) < 0.001) return true;
        return false;
    });

    if (stat) return stat.xp;

    if (cr > 30) {
        return 155000 + (cr - 30) * 5000;
    }

    let closestStat = MONSTER_STATS[0];
    let minDiff = Math.abs(closestStat.cr_number - cr);

    for (const s of MONSTER_STATS) {
        const diff = Math.abs(s.cr_number - cr);
        if (diff < minDiff) {
            minDiff = diff;
            closestStat = s;
        }
    }

    if (minDiff < 0.5) {
        return closestStat.xp;
    }

    return 0;
}

// Calculate adjusted XP from list of XP values
export function computeAdjustedXpFromListXp(
    partySize: number,
    listXP: number[]
): number {
    const multTable = ENC_XP_MULTIPLIERS.filter(
        (n) => n.party_size === partySize
    );

    const sum = listXP.reduce((partialSum, a) => partialSum + a, 0);
    let numberOfMonsters = listXP.length;

    if (numberOfMonsters > 15) numberOfMonsters = 15;
    if (numberOfMonsters === 0) numberOfMonsters = 1;

    const multiplierEntry = multTable.find(
        (n) => n.number_of_monsters === numberOfMonsters
    );
    const multiplier = multiplierEntry ? multiplierEntry.multiplier : 1;

    return sum * multiplier;
}

// Calculate adjusted XP from creature list
export function computeAdjustedXpOfCreatures(
    partySize: number,
    creatures: Array<{ quantity: number; xp: number }>
): { ADJUSTED_XP: number; TOTAL_XP: number } {
    const multTable = ENC_XP_MULTIPLIERS.filter(
        (n) => n.party_size === partySize
    );

    let numberOfMonsters = 0;
    let XP = 0;

    for (const creature of creatures) {
        numberOfMonsters += creature.quantity;
        XP += creature.xp * creature.quantity;
    }

    if (numberOfMonsters > 15) numberOfMonsters = 15;
    if (numberOfMonsters === 0) numberOfMonsters = 1;

    const multiplierEntry = multTable.find(
        (n) => n.number_of_monsters === numberOfMonsters
    );
    const multiplier = multiplierEntry ? multiplierEntry.multiplier : 1;

    return { ADJUSTED_XP: XP * multiplier, TOTAL_XP: XP };
}

// Calculate XP bounds for a party and difficulty
export function calculateXpBounds(
    averageLevel: number,
    partySize: number,
    difficulty: string
): { xpLowerBound: number; xpUpperBound: number } {
    const levelThresholds =
        XP_THRESHOLDS.find((t) => t.char_level === Math.floor(averageLevel)) ||
        XP_THRESHOLDS[0];

    const difficultyUpper =
        difficulty.toUpperCase() as keyof typeof levelThresholds;
    const xpLowerBound =
        (levelThresholds[difficultyUpper] || levelThresholds.medium) *
        partySize;

    const difficultyOrder = [
        "trivial",
        "easy",
        "medium",
        "hard",
        "deadly",
        "absurd",
    ];
    const currentIndex = difficultyOrder.indexOf(difficulty);

    let xpUpperBound: number;
    if (currentIndex === 5) {
        xpUpperBound = xpLowerBound * 100;
    } else {
        const nextDifficulty = difficultyOrder[
            currentIndex + 1
        ] as keyof typeof levelThresholds;
        xpUpperBound =
            (levelThresholds[nextDifficulty] || levelThresholds.deadly) *
            partySize;
    }

    return { xpLowerBound, xpUpperBound };
}

// Filter monsters by criteria
export function filterMonsters(
    allMonsters: any[],
    xpUpperBound: number,
    habitat: string | null,
    biome: Biome | null,
    timeOfDay: string | null,
    travelMedium: string | null
): any[] {
    let filtered = allMonsters.filter((m) => {
        const monsterXP = getXpFromCr(m.cr);
        return monsterXP <= xpUpperBound;
    });

    if (habitat && filtered.length > 0) {
        filtered = filtered.filter((m) => {
            if (m.habitat && m.habitat.includes(habitat)) return true;
            if (m.biome && Array.isArray(m.biome)) {
                const biomeLower = biome?.toLowerCase();
                return m.biome.some(
                    (b: string) =>
                        b &&
                        typeof b === "string" &&
                        b.toLowerCase() === biomeLower
                );
            }
            return false;
        });
    }

    if (timeOfDay && filtered.length > 0) {
        filtered = filtered.filter((m) => {
            if (!m.time_of_day) return true;
            if (Array.isArray(m.time_of_day)) {
                return (
                    m.time_of_day.includes(timeOfDay) ||
                    m.time_of_day.includes("all")
                );
            }
            return m.time_of_day === timeOfDay || m.time_of_day === "all";
        });
    }

    if (travelMedium && filtered.length > 0) {
        const mediumMap: Record<string, string> = {
            ground: "land",
            air: "air",
            sea: "water",
        };
        const travelMed = mediumMap[travelMedium] || travelMedium;
        filtered = filtered.filter(
            (m) =>
                !m.travelMedium ||
                (Array.isArray(m.travelMedium) &&
                    m.travelMedium.includes(travelMed)) ||
                m.travelMedium === travelMed
        );
    }

    if (filtered.length === 0) {
        filtered = allMonsters.filter((m) => {
            const monsterXP = getXpFromCr(m.cr);
            return monsterXP <= xpUpperBound;
        });
    }

    return filtered;
}

// Map Biome to non-combat encounter table name
export function mapBiomeToNonCombatTable(
    biome: Biome | null
): string | null {
    if (!biome) return null;

    const biomeLower = biome.toLowerCase();

    // Arctic biomes -> arctic_nc
    if (
        biomeLower.includes("tundra") ||
        biomeLower.includes("boreal") ||
        biomeLower.includes("taiga") ||
        biomeLower.includes("rock and ice")
    ) {
        return "arctic_nc";
    }

    // Desert biomes -> desert_nc
    if (biomeLower.includes("desert") || biomeLower.includes("xeric")) {
        return "desert_nc";
    }

    // Forest biomes -> forest_nc or woodland_nc
    if (biomeLower.includes("forest")) {
        // Check for specific forest types
        if (biomeLower.includes("tropical") || biomeLower.includes("subtropical")) {
            return "jungle_nc"; // Tropical forests use jungle table
        }
        return "forest_nc";
    }

    // Grassland biomes -> grassland_nc
    if (
        biomeLower.includes("grassland") ||
        biomeLower.includes("savanna") ||
        biomeLower.includes("savannas")
    ) {
        return "grassland_nc";
    }

    // Mountain biomes -> mountain_nc
    if (biomeLower.includes("montane") || biomeLower.includes("mountain")) {
        return "mountain_nc";
    }

    // Swamp/Mangrove biomes -> swamp_nc
    if (biomeLower.includes("mangrove")) {
        return "swamp_nc";
    }

    // Coastal/Flooded biomes -> coastal_nc
    if (biomeLower.includes("flooded")) {
        return "coastal_nc";
    }

    // Default fallback to forest
    return "forest_nc";
}

// Roll encounter distance based on biome
export function rollEncounterDistance(biome: Biome | null, travelMedium: string | null): number {
    if (!biome) {
        // Default fallback: 2d6 × 10 feet
        return (Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6) + 1) * 10;
    }

    // Map biome to habitat for distance lookup
    const habitat = mapBiomeToHabitat(biome);
    
    // For sea travel, use Waterborne or Open Water
    let lookupBiome = habitat;
    if (travelMedium === "sea") {
        // Try Waterborne first, then Open Water
        const waterborneEntry = oaEncounterDistance.find(
            (entry) => entry.biome === "Waterborne"
        );
        if (waterborneEntry) {
            lookupBiome = "Waterborne";
        } else {
            const openWaterEntry = oaEncounterDistance.find(
                (entry) => entry.biome === "Open Water"
            );
            if (openWaterEntry) {
                lookupBiome = "Open Water";
            }
        }
    }

    // Find the distance entry for this biome/habitat
    const distanceEntry = oaEncounterDistance.find(
        (entry) => entry.biome === lookupBiome
    );

    if (!distanceEntry) {
        // Default fallback: 2d6 × 10 feet
        return (Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6) + 1) * 10;
    }

    // Roll the dice
    let total = 0;
    for (let i = 0; i < distanceEntry.number_of_dice; i++) {
        total += Math.floor(Math.random() * distanceEntry.number_of_sides) + 1;
    }

    return total * distanceEntry.multiplier;
}