/** @format */

import type { Biome } from "@/app/(app)/app/encounter-generator/_constants/encounters";
import type { GenerateEncounterOpts } from "@/app/(app)/app/encounter-generator/_components/RollEncounterDialog";
import {
    getXpFromCr,
    computeAdjustedXpFromListXp,
    computeAdjustedXpOfCreatures,
    calculateXpBounds,
    filterMonsters,
    mapBiomeToHabitat,
} from "./combat-encounter-helpers";

type CreatureEntry = {
    QUANTITY: number;
    CREATURE: string;
    XP: number;
    LABEL: string;
    name: string;
    cr: number;
    crText?: string;
    url?: string;
    quantity: number;
};

// Get creature from relationship list by name
export function getCreatureFromRelationshipList(
    list: string[] | null | undefined,
    allMonsters: any[]
): any | null {
    if (!list || !Array.isArray(list) || list.length === 0) return null;

    const randomName = list[Math.floor(Math.random() * list.length)];
    const monster = allMonsters.find(
        (m) => m.name && m.name.toLowerCase() === randomName.toLowerCase()
    );

    return monster || null;
}

// Get leader from filtered encounter list
export function getLeader(
    encounter: any[],
    level: number,
    allMonsters: any[]
): any | null {
    const lowerLeaderCR = Math.round(level * 0.8);
    const upperLeaderCR = Math.round(level * 1.2);
    const maxCR = Math.max(...encounter.map((o) => o.cr ?? 0));

    let leaderCandidates = encounter;
    if (maxCR >= lowerLeaderCR && maxCR <= upperLeaderCR) {
        leaderCandidates = encounter.filter(
            (n) => n.cr >= lowerLeaderCR && n.cr <= upperLeaderCR
        );
    } else {
        leaderCandidates = encounter.filter((n) => n.cr === maxCR);
    }

    let leader = leaderCandidates.find(
        (m) =>
            m.FOLLOWERS && Array.isArray(m.FOLLOWERS) && m.FOLLOWERS.length > 0
    );

    if (!leader) {
        leader = leaderCandidates.find(
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
    }

    if (!leader && leaderCandidates.length > 0) {
        leader =
            leaderCandidates[
                Math.floor(Math.random() * leaderCandidates.length)
            ];
    }

    if (leader) {
        const leaderLeader = getCreatureFromRelationshipList(
            leader.LEADERS,
            allMonsters
        );
        const lieutenant = getCreatureFromRelationshipList(
            leader.LIEUTENANTS,
            allMonsters
        );
        const sergeant = getCreatureFromRelationshipList(
            leader.SERGEANTS,
            allMonsters
        );

        const randomLeader = [
            leader,
            leaderLeader,
            lieutenant,
            sergeant,
        ].filter(Boolean);
        if (randomLeader.length > 0) {
            return randomLeader[
                Math.floor(Math.random() * randomLeader.length)
            ];
        }
    }

    return leader || null;
}

// Add creatures from relationship list to encounter
export async function addCreatureToCreatureListFromRelationship(
    xpLowerBound: number,
    xpUpperBound: number,
    relationship: any | null,
    creatures: CreatureEntry[],
    partySize: number,
    listXP: number[],
    label: string
): Promise<{ CREATURES: CreatureEntry[]; LIST_XP: number[] }> {
    if (!relationship) {
        return { CREATURES: creatures, LIST_XP: listXP };
    }

    const relationshipXP = getXpFromCr(relationship.cr);
    if (relationshipXP === 0) {
        return { CREATURES: creatures, LIST_XP: listXP };
    }

    let count = 0;
    let adjustedXP = computeAdjustedXpFromListXp(partySize, listXP);

    if (adjustedXP >= xpLowerBound && adjustedXP <= xpUpperBound) {
        return { CREATURES: creatures, LIST_XP: listXP };
    }

    while (adjustedXP <= xpUpperBound) {
        listXP.push(relationshipXP);
        adjustedXP = computeAdjustedXpFromListXp(partySize, listXP);

        if (adjustedXP <= xpUpperBound) {
            count += 1;
        } else {
            listXP.pop();
            break;
        }

        if (adjustedXP >= xpLowerBound && adjustedXP <= xpUpperBound) {
            break;
        }
    }

    if (count > 0) {
        creatures.push({
            QUANTITY: count,
            CREATURE: relationship.name || "Unknown",
            XP: relationshipXP,
            LABEL: label,
            name: relationship.name,
            cr: relationship.cr,
            crText: relationship.crText,
            url: relationship.url,
            quantity: count,
        });
    }

    return { CREATURES: creatures, LIST_XP: listXP };
}

// Generate encounter with leader and followers
export async function generateLeaderFollowerEncounter(
    leader: any,
    xpLowerBound: number,
    xpUpperBound: number,
    partySize: number,
    allMonsters: any[]
): Promise<{
    monsters: Array<{
        name: string;
        cr: number;
        crText?: string;
        quantity: number;
        url?: string;
        label: string;
    }>;
    xpLowerBound: number;
    xpUpperBound: number;
    adjustedXP: number;
    totalXP: number;
    xpPerPC: number;
    numberOfCreatures: number;
}> {
    const leaderXP = getXpFromCr(leader.cr);
    const creatures: CreatureEntry[] = [];
    const listXP: number[] = [leaderXP];

    creatures.push({
        QUANTITY: 1,
        CREATURE: leader.name || "Unknown",
        XP: leaderXP,
        LABEL: "leader",
        name: leader.name,
        cr: leader.cr,
        crText: leader.crText,
        url: leader.url,
        quantity: 1,
    });

    const leaderLeader = getCreatureFromRelationshipList(
        leader.LEADERS,
        allMonsters
    );
    const lieutenant = getCreatureFromRelationshipList(
        leader.LIEUTENANTS,
        allMonsters
    );
    const sergeant = getCreatureFromRelationshipList(
        leader.SERGEANTS,
        allMonsters
    );
    const minion = getCreatureFromRelationshipList(leader.MINIONS, allMonsters);
    const follower = getCreatureFromRelationshipList(
        leader.FOLLOWERS || leader.FOLLOWEWRS,
        allMonsters
    );

    let result = await addCreatureToCreatureListFromRelationship(
        xpLowerBound,
        xpUpperBound,
        lieutenant,
        creatures,
        partySize,
        listXP,
        "lieutenant"
    );
    result = await addCreatureToCreatureListFromRelationship(
        xpLowerBound,
        xpUpperBound,
        sergeant,
        result.CREATURES,
        partySize,
        result.LIST_XP,
        "sergeant"
    );
    result = await addCreatureToCreatureListFromRelationship(
        xpLowerBound,
        xpUpperBound,
        minion,
        result.CREATURES,
        partySize,
        result.LIST_XP,
        "minion"
    );
    result = await addCreatureToCreatureListFromRelationship(
        xpLowerBound,
        xpUpperBound,
        follower,
        result.CREATURES,
        partySize,
        result.LIST_XP,
        "minion"
    );

    const xpData = computeAdjustedXpOfCreatures(
        partySize,
        result.CREATURES.map((c) => ({ quantity: c.quantity, xp: c.XP }))
    );

    const monsters = result.CREATURES.map((c) => ({
        name: c.name,
        cr: c.cr,
        crText: c.crText,
        quantity: c.quantity,
        url: c.url,
        label: c.LABEL,
    }));

    const totalCreatureCount = monsters.reduce((sum, m) => sum + m.quantity, 0);

    return {
        monsters,
        xpLowerBound,
        xpUpperBound,
        adjustedXP: xpData.ADJUSTED_XP,
        totalXP: xpData.TOTAL_XP,
        xpPerPC: xpData.TOTAL_XP / partySize,
        numberOfCreatures: totalCreatureCount,
    };
}

// Generate simple encounter without relationship data
export function generateSimpleEncounter(
    selectedMonster: any,
    xpLowerBound: number,
    xpUpperBound: number,
    partySize: number
): {
    monsters: Array<{
        name: string;
        cr: number;
        crText?: string;
        quantity: number;
        url?: string;
    }>;
    xpLowerBound: number;
    xpUpperBound: number;
    adjustedXP: number;
    totalXP: number;
    xpPerPC: number;
    numberOfCreatures: number;
} {
    const monsterXP = getXpFromCr(selectedMonster.cr);

    let quantity = 1;
    let currentXP = monsterXP;
    while (currentXP < xpLowerBound && quantity < 15) {
        quantity++;
        const adjusted = computeAdjustedXpFromListXp(
            partySize,
            Array(quantity).fill(monsterXP)
        );
        if (adjusted > xpUpperBound) {
            quantity--;
            break;
        }
        currentXP = adjusted;
    }

    const finalXP = monsterXP * quantity;
    const finalAdjustedXP = computeAdjustedXpFromListXp(
        partySize,
        Array(quantity).fill(monsterXP)
    );

    return {
        monsters: [
            {
                name: selectedMonster.name,
                cr: selectedMonster.cr,
                crText: selectedMonster.crText,
                quantity,
                url: selectedMonster.url,
            },
        ],
        xpLowerBound,
        xpUpperBound,
        adjustedXP: finalAdjustedXP,
        totalXP: finalXP,
        xpPerPC: finalXP / partySize,
        numberOfCreatures: quantity,
    };
}

// Calculate party statistics
export function calculatePartyStats(
    party: { pcs: Array<{ level: number; quantity: number }> } | null
): {
    averageLevel: number;
    partySize: number;
} {
    if (!party || !party.pcs || party.pcs.length === 0) {
        return { averageLevel: 1, partySize: 1 };
    }

    let totalLevel = 0;
    let totalQuantity = 0;
    for (const pc of party.pcs) {
        totalLevel += pc.level * pc.quantity;
        totalQuantity += pc.quantity;
    }
    const averageLevel = totalQuantity > 0 ? totalLevel / totalQuantity : 1;
    const partySize = Math.min(totalQuantity, 6);

    return { averageLevel, partySize };
}
