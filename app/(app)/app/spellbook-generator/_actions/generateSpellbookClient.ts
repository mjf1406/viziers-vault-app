/** @format */

"use client";

import {
    FisherYatesShuffle,
    resolveSelections,
    toTitleCase,
    dedupeBy,
    takeRandom,
    toNumber,
    clampNumber,
    rollDiceExpression,
} from "@/lib/utils";
import { resolveLevel } from "@/lib/5e-utils";
import { CLASSES, SCHOOLS, SPELLS_PER_LEVEL } from "@/lib/5e-data";
import db from "@/lib/db";
import { id } from "@instantdb/react";

type GenerateOpts = {
    level: number | "random";
    schools: string[] | "random";
    classes: string[] | "random";
    sourceShorts?: string[];
    excludeLegacy?: boolean;
};

export type Dnd5eSpell = {
    dndbeyondId: string;
    name?: string;
    slug?: string;
    levelText?: string;
    level?: number;
    castingTime?: string;
    range?: string;
    area?: string;
    areaShape?: string;
    components?: string;
    materialComponents?: string;
    duration?: string;
    school?: string;
    attackSave?: string;
    damageEffect?: string;
    description?: string;
    classes?: string[];
    source?: string;
    sourceShort?: string;
    url?: string;
    updatedAt?: Date;
};

type SpellbookGenerateResponse =
    | string
    | {
          spells: Dnd5eSpell[];
          options: {
              level: GenerateOpts["level"];
              schools: string[];
              classes: string[];
              sourceShorts?: string[];
              excludeLegacy?: boolean;
          };
      };

type GenerateSpellbookClientInput = {
    level: number | "random";
    schools: string[] | "random";
    classes: string[] | "random";
    sourceShorts?: string[];
    excludeLegacy?: boolean;
    name?: string;
    userId?: string | null;
    userSettings?: { spellbookExtraSpellsDice?: string } | null;
    allSpells: Dnd5eSpell[];
};

export async function generateSpellbookClient(
    input: GenerateSpellbookClientInput
): Promise<SpellbookGenerateResponse> {
    try {
        const resolved = resolveOptions(
            input.level,
            input.schools,
            input.classes
        );

        const { leveled, cantrips } = filterSpells(
            input.allSpells,
            resolved,
            input.sourceShorts,
            input.excludeLegacy
        );

        const characterLevel = calculateCharacterLevel(resolved.levels);
        const playerClass = resolved.classes?.[0] ?? "";

        const overrides = getUserOverrides(
            input.userSettings,
            playerClass,
            characterLevel
        );

        const spellbook = selectSpellsForSpellbook(
            cantrips,
            leveled,
            playerClass,
            characterLevel,
            overrides
        );

        const result = {
            spells: spellbook,
            options: {
                level: input.level,
                schools: resolved.schools,
                classes: resolved.classes,
                sourceShorts: input.sourceShorts,
                excludeLegacy: input.excludeLegacy,
            },
        };

        if (input.userId) {
            const spellbookId = await saveSpellbookRecord({
                userId: input.userId,
                spells: result.spells,
                options: result.options,
                name: input.name,
            });
            return spellbookId;
        }

        return result;
    } catch (err) {
        if (process.env.NEXT_PUBLIC_VV_DEBUG) {
            // eslint-disable-next-line no-console
            console.error("generateSpellbookClient error:", err);
        }
        throw err;
    }
}

function filterSpells(
    allSpells: Dnd5eSpell[],
    resolved: {
        levels: number[];
        schools: string[];
        classes: string[];
    },
    sourceShorts?: string[],
    excludeLegacy?: boolean
): {
    leveled: Dnd5eSpell[];
    cantrips: Dnd5eSpell[];
} {
    let leveledRaw = allSpells.filter((spell) => {
        const level = toNumber(spell.level);
        return (
            level > 0 &&
            resolved.levels.includes(level) &&
            resolved.schools.includes(String(spell.school || "").trim()) &&
            (!sourceShorts ||
                sourceShorts.length === 0 ||
                (spell.sourceShort &&
                    sourceShorts.includes(
                        String(spell.sourceShort).toLowerCase()
                    )))
        );
    });

    let cantripsRaw = allSpells.filter((spell) => {
        const level = toNumber(spell.level);
        return (
            level === 0 &&
            resolved.schools.includes(String(spell.school || "").trim()) &&
            (!sourceShorts ||
                sourceShorts.length === 0 ||
                (spell.sourceShort &&
                    sourceShorts.includes(
                        String(spell.sourceShort).toLowerCase()
                    )))
        );
    });

    let leveled = filterSpellsByClasses(leveledRaw, resolved.classes);
    let cantrips = filterSpellsByClasses(cantripsRaw, resolved.classes);

    if (excludeLegacy) {
        leveled = filterLegacySpells(leveled);
        cantrips = filterLegacySpells(cantrips);
    }

    return { leveled, cantrips };
}

function filterLegacySpells(spells: Dnd5eSpell[]): Dnd5eSpell[] {
    return spells.filter(
        (s) =>
            String(s.school || "")
                .trim()
                .toLowerCase() !== "legacy"
    );
}

function calculateCharacterLevel(levels: number[]): number {
    return clampNumber(
        Math.max(...levels.map((n) => toNumber(n)).filter((n) => n >= 0)),
        1,
        20
    );
}

function getUserOverrides(
    userSettings: { spellbookExtraSpellsDice?: string } | null | undefined,
    playerClass: string,
    characterLevel: number
): { cantripsTarget?: number; spellsTarget?: number } {
    if (!userSettings) return {};
    try {
        const extraExpr = userSettings.spellbookExtraSpellsDice;
        return computeAdjustedTargets(playerClass, characterLevel, extraExpr);
    } catch {
        return {};
    }
}

function selectSpellsForSpellbook(
    cantrips: Dnd5eSpell[],
    leveledSpells: Dnd5eSpell[],
    playerClass: string,
    characterLevel: number,
    overrides?: { cantripsTarget?: number; spellsTarget?: number }
): Dnd5eSpell[] {
    const targets = getClassSpellTargets(
        playerClass,
        characterLevel,
        overrides
    );

    if (!targets) {
        return [...cantrips, ...leveledSpells];
    }

    const pools = prepareSpellPools(
        cantrips,
        leveledSpells,
        targets.maxSpellLevel
    );

    return selectAndSortSpells(pools, targets);
}

function getClassSpellTargets(
    playerClass: string,
    characterLevel: number,
    overrides?: { cantripsTarget?: number; spellsTarget?: number }
): {
    cantripsTarget: number;
    spellsTarget: number;
    maxSpellLevel: number;
} | null {
    const classKey = toTitleCase(playerClass ?? "");
    const classTable = (SPELLS_PER_LEVEL as any)?.[classKey];
    if (!classTable) return null;

    const row = classTable[String(characterLevel)] ?? classTable["20"];
    if (!row) return null;

    const cantripsTarget = Math.max(
        overrides?.cantripsTarget ?? row.cantrips ?? 0,
        0
    );

    const maxSpellLevel =
        typeof row.maxSpellLevel === "number" && row.maxSpellLevel >= 0
            ? row.maxSpellLevel
            : 9;

    const spellsTargetRaw =
        row.spells == null
            ? 1 + Math.floor(Math.random() * 5) + Math.floor(characterLevel / 2)
            : Math.max(Number(row.spells) || 0, 0);

    const spellsTarget = Math.max(
        overrides?.spellsTarget ?? spellsTargetRaw,
        0
    );

    return { cantripsTarget, spellsTarget, maxSpellLevel };
}

function prepareSpellPools(
    cantrips: Dnd5eSpell[],
    leveledSpells: Dnd5eSpell[],
    maxSpellLevel: number
): {
    cantripsPool: Dnd5eSpell[];
    leveledPool: Dnd5eSpell[];
} {
    const idKey = (s: Dnd5eSpell) => s.dndbeyondId || s.slug || s.name || "";

    const cantripsPool = dedupeBy(
        cantrips.filter((s) => toNumber(s.level) === 0),
        idKey
    );

    const leveledPool = dedupeBy(
        leveledSpells.filter((s) => {
            const lvl = toNumber(s.level);
            return lvl > 0 && lvl <= maxSpellLevel;
        }),
        idKey
    );

    return { cantripsPool, leveledPool };
}

function selectAndSortSpells(
    pools: { cantripsPool: Dnd5eSpell[]; leveledPool: Dnd5eSpell[] },
    targets: { cantripsTarget: number; spellsTarget: number }
): Dnd5eSpell[] {
    const chosenCantrips = takeRandom(
        pools.cantripsPool,
        targets.cantripsTarget
    );
    const chosenLeveled = takeRandom(pools.leveledPool, targets.spellsTarget);
    const selected = [...chosenCantrips, ...chosenLeveled];

    selected.sort((a, b) => {
        const la = toNumber(a.level);
        const lb = toNumber(b.level);
        if (la !== lb) return la - lb;
        return (a.name || "").localeCompare(b.name || "");
    });

    return selected;
}

function computeAdjustedTargets(
    playerClass: string,
    characterLevel: number,
    modifier: string | null | undefined
): { cantripsTarget: number; spellsTarget: number } {
    const base = calculateBaseTargets(playerClass, characterLevel);
    const raw = String(modifier ?? "").trim();

    if (!raw) {
        return {
            cantripsTarget: base.cantrips,
            spellsTarget: base.spells,
        };
    }

    const targetTotal = parseModifier(raw, base.total);
    return distributeTargets(base, targetTotal);
}

function calculateBaseTargets(
    playerClass: string,
    characterLevel: number
): {
    cantrips: number;
    spells: number;
    total: number;
} {
    const classKey = toTitleCase(playerClass ?? "");
    const classTable = (SPELLS_PER_LEVEL as any)?.[classKey];
    const row = classTable
        ? classTable[String(characterLevel)] ?? classTable["20"]
        : null;

    const cantrips = Math.max(row?.cantrips ?? 0, 0);
    const spells = Math.max(
        row?.spells == null
            ? 1 + Math.floor(Math.random() * 5) + Math.floor(characterLevel / 2)
            : Number(row?.spells) || 0,
        0
    );

    return { cantrips, spells, total: cantrips + spells };
}

function parseModifier(raw: string, baseTotal: number): number {
    const mulDiv = raw.match(/^([*\/])\s*(\d+(?:\.\d+)?)$/);
    if (mulDiv) {
        const op = mulDiv[1];
        const k = Math.max(0.0001, Math.min(parseFloat(mulDiv[2]), 10));
        return op === "*"
            ? Math.floor(baseTotal * k)
            : Math.floor(baseTotal / k);
    }

    if (/^[+-]?\s*\d+$/.test(raw)) {
        return Math.max(0, baseTotal + parseInt(raw.replace(/\s+/g, ""), 10));
    }

    return Math.max(0, baseTotal + rollDiceExpression(raw));
}

function distributeTargets(
    base: { cantrips: number; spells: number; total: number },
    targetTotal: number
): { cantripsTarget: number; spellsTarget: number } {
    if (base.total <= 0) {
        return { cantripsTarget: 0, spellsTarget: targetTotal };
    }

    const ratio = targetTotal / base.total;
    const newCantrips = Math.max(0, Math.floor(base.cantrips * ratio));
    const newLeveled = Math.max(0, targetTotal - newCantrips);

    return { cantripsTarget: newCantrips, spellsTarget: newLeveled };
}

function resolveOptions(
    level: GenerateOpts["level"],
    schools: GenerateOpts["schools"],
    classes: GenerateOpts["classes"]
): {
    levels: number[];
    schools: string[];
    classes: string[];
} {
    const levels = resolveLevel(level);
    const resolvedSchools = resolveSelections(schools, SCHOOLS);
    const resolvedClasses = resolveSelections(classes, CLASSES, {
        min: 1,
        max: 1,
    }).map((c) => c.toUpperCase());
    return { levels, schools: resolvedSchools, classes: resolvedClasses };
}

function filterSpellsByClasses(
    spells: Dnd5eSpell[],
    classes: string[]
): Dnd5eSpell[] {
    if (!classes || classes.length === 0) return spells;

    return spells.filter((spell) =>
        spell.classes?.some((spellClass) =>
            classes.some((playerClass) =>
                String(spellClass).toUpperCase().startsWith(playerClass)
            )
        )
    );
}

async function saveSpellbookRecord(args: {
    userId: string;
    spells: Dnd5eSpell[];
    options: {
        level: GenerateOpts["level"];
        schools: string[];
        classes: string[];
        sourceShorts?: string[];
        excludeLegacy?: boolean;
    };
    name?: string;
}): Promise<string> {
    const { userId, spells, options, name } = args;

    const spellbookId = id();
    const createdAt = new Date();

    const record = {
        name: name?.trim() || undefined,
        createdAt,
        options,
        spellCount: spells.length,
        spells,
    };

    await db.transact(
        db.tx.spellbooks[spellbookId].create(record).link({ owner: userId })
    );

    return spellbookId;
}
