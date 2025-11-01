/** @format */

// app/spellbook-generator/_actions/generateSpellbook.ts

"use server";

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
import dbServer from "@/server/db-server";
import { getAuthAndSaveEligibility } from "@/server/auth";
import { randomUUID } from "crypto";

type GenerateOpts = {
    level: number | "random";
    schools: string[] | "random";
    classes: string[] | "random";
    sourceShorts?: string[];
    excludeLegacy?: boolean;
};

type Dnd5eSpell = {
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

/**
 * Generate spells only without saving to database
 * Used for client-side updates
 */
export async function generateSpellsOnly(formData: FormData): Promise<{
    spells: Dnd5eSpell[];
    options: {
        level: GenerateOpts["level"];
        schools: string[];
        classes: string[];
        sourceShorts?: string[];
        excludeLegacy?: boolean;
    };
}> {
    try {
        const result = await buildSpellbookFromOptions(formData, false);
        return {
            spells: result.spells,
            options: result.options,
        };
    } catch (err) {
        if (process.env.VV_DEBUG) {
            // eslint-disable-next-line no-console
            console.error("generateSpellsOnly error:", err);
        }
        throw err;
    }
}

export default async function generateSpellbook(
    formData: FormData
): Promise<SpellbookGenerateResponse> {
    try {
        const auth = await getAuthAndSaveEligibility();
        const result = await buildSpellbookFromOptions(
            formData,
            true,
            auth.uid
        );

        logGenerationDebug(auth, result);

        if (auth.canSave && auth.userIdForSave) {
            const id = await saveSpellbookRecord({
                userId: auth.userIdForSave,
                spells: result.spells,
                options: result.options,
                formData,
            });
            return id;
        }

        return {
            spells: result.spells,
            options: result.options,
        };
    } catch (err) {
        if (process.env.VV_DEBUG) {
            // eslint-disable-next-line no-console
            console.error("generateSpellbook error:", err);
        }
        throw err;
    }
}

/**
 * Core spellbook generation logic shared by both entry points
 */
async function buildSpellbookFromOptions(
    formData: FormData,
    requireAuth: boolean,
    uid?: string | null | undefined
): Promise<{
    spells: Dnd5eSpell[];
    options: {
        level: GenerateOpts["level"];
        schools: string[];
        classes: string[];
        sourceShorts?: string[];
        excludeLegacy?: boolean;
    };
}> {
    const parsed = parseFormDataToOptions(formData);
    const resolved = resolveOptions(
        parsed.level,
        parsed.schools,
        parsed.classes
    );

    const { leveled, cantrips } = await fetchAndFilterSpells(
        resolved,
        parsed.sourceShorts,
        parsed.excludeLegacy
    );

    const characterLevel = calculateCharacterLevel(resolved.levels);
    const playerClass = resolved.classes?.[0] ?? "";

    const overrides = await getUserOverrides(
        uid,
        playerClass,
        characterLevel,
        requireAuth
    );

    const spellbook = selectSpellsForSpellbook(
        cantrips,
        leveled,
        playerClass,
        characterLevel,
        overrides
    );

    return {
        spells: spellbook,
        options: {
            level: parsed.level,
            schools: resolved.schools,
            classes: resolved.classes,
            sourceShorts: parsed.sourceShorts,
            excludeLegacy: parsed.excludeLegacy,
        },
    };
}

async function fetchAndFilterSpells(
    resolved: {
        levels: number[];
        schools: string[];
        classes: string[];
    },
    sourceShorts?: string[],
    excludeLegacy?: boolean
): Promise<{
    leveled: Dnd5eSpell[];
    cantrips: Dnd5eSpell[];
}> {
    const [leveledRaw, cantripsRaw] = await Promise.all([
        fetchSpells(resolved.levels, resolved.schools, sourceShorts),
        fetchCantrips(resolved.schools, sourceShorts),
    ]);

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

async function getUserOverrides(
    uid: string | null | undefined,
    playerClass: string,
    characterLevel: number,
    requireAuth: boolean
): Promise<{ cantripsTarget?: number; spellsTarget?: number }> {
    if (!uid) return {};
    try {
        const extraExpr = await fetchUserExtraDice(uid);
        return computeAdjustedTargets(playerClass, characterLevel, extraExpr);
    } catch {
        return {};
    }
}

function logGenerationDebug(
    auth: Awaited<ReturnType<typeof getAuthAndSaveEligibility>>,
    result: {
        spells: Dnd5eSpell[];
        options: {
            level: GenerateOpts["level"];
            schools: string[];
            classes: string[];
        };
    }
): void {
    if (process.env.VV_DEBUG) {
        // eslint-disable-next-line no-console
        console.log("generateSpellbook — resolved options:", {
            level: result.options.level,
            schools: result.options.schools,
            classes: result.options.classes,
            spellbook: result.spells.length,
            canSave: auth.canSave,
        });
    }
}

/**
 * Select spells for spellbook based on class rules and targets
 */
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

function parseFormDataToOptions(formData: FormData): {
    level: GenerateOpts["level"];
    schools: GenerateOpts["schools"];
    classes: GenerateOpts["classes"];
    sourceShorts: string[];
    excludeLegacy: boolean;
    name?: string;
} {
    const rawLevel = formData.get("level")?.toString() ?? "random";
    const level: GenerateOpts["level"] =
        rawLevel === "random" ? "random" : parseInt(rawLevel, 10);

    const schoolsIsRandom = formData.get("schools") === "random";
    const schools: GenerateOpts["schools"] = schoolsIsRandom
        ? "random"
        : formData.getAll("schools[]").map(String);

    const classesIsRandom = formData.get("classes") === "random";
    const classes: GenerateOpts["classes"] = classesIsRandom
        ? "random"
        : formData.getAll("classes[]").map(String);

    const sourceShorts = formData
        .getAll("sourceShorts[]")
        .map((s) => String(s).toLowerCase()) as string[];

    const excludeLegacy =
        formData.get("excludeLegacyNormalized")?.toString() === "1" ||
        formData.get("excludeLegacy")?.toString() === "on";

    const nameRaw = formData.get("name");
    const name = typeof nameRaw === "string" ? nameRaw.trim() : undefined;

    return { level, schools, classes, sourceShorts, excludeLegacy, name };
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

async function dbQuery<T>(q: unknown): Promise<T | null> {
    const res = await (dbServer as any).query(q);
    return (res as T) ?? null;
}

async function fetchUserExtraDice(
    uid: string | null | undefined
): Promise<string> {
    if (!uid) return "";
    const res = await dbQuery<{
        $users?: { settings?: { spellbookExtraSpellsDice?: string }[] }[];
    }>({
        $users: { $: { where: { id: uid } }, settings: {} },
    });
    const first = res?.$users?.[0]?.settings?.[0];
    return (first?.spellbookExtraSpellsDice || "").toString();
}

async function fetchSpells(
    levels: number[],
    schools: string[],
    sourceShorts?: string[]
): Promise<Dnd5eSpell[]> {
    const query = {
        dnd5e_spells: {
            $: {
                where: {
                    level: { $in: levels },
                    school: { $in: schools },
                    ...(Array.isArray(sourceShorts) && sourceShorts.length
                        ? { sourceShort: { $in: sourceShorts } }
                        : {}),
                },
            },
        },
    };

    const res = await dbQuery<{ dnd5e_spells?: Dnd5eSpell[] }>(query);
    return res?.dnd5e_spells ?? [];
}

async function fetchCantrips(
    schools: string[],
    sourceShorts?: string[]
): Promise<Dnd5eSpell[]> {
    const query = {
        dnd5e_spells: {
            $: {
                where: {
                    level: { $in: [0] },
                    school: { $in: schools },
                    ...(Array.isArray(sourceShorts) && sourceShorts.length
                        ? { sourceShort: { $in: sourceShorts } }
                        : {}),
                },
            },
        },
    };
    const res = await dbQuery<{ dnd5e_spells?: Dnd5eSpell[] }>(query);
    return res?.dnd5e_spells ?? [];
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
    formData: FormData;
}): Promise<string> {
    const { userId, spells, options, formData } = args;

    const id = randomUUID();
    const createdAt = new Date();
    const nameRaw = formData.get("name");
    const name = typeof nameRaw === "string" ? nameRaw.trim() : undefined;

    const record = {
        name: name || undefined,
        createdAt,
        options,
        spellCount: spells.length,
        spells,
        creatorId: userId,
    } as any;

    await dbServer.transact(
        dbServer.tx.spellbooks[id].create(record).link({ $user: userId })
    );

    return id;
}
