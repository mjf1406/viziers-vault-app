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

type AllowedPlan = "free" | "basic" | "plus" | "pro";

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
        // Parse incoming form
        const parsed = parseFormDataToOptions(formData);

        // Resolve "random" tokens to concrete values
        const resolved = resolveOptions(
            parsed.level,
            parsed.schools,
            parsed.classes
        );

        // Fetch leveled spells and cantrips separately, then filter by class
        const [leveledRaw, cantripsRaw] = await Promise.all([
            fetchSpells(resolved.levels, resolved.schools, parsed.sourceShorts),
            fetchCantrips(resolved.schools, parsed.sourceShorts),
        ]);
        let leveled = filterSpellsByClasses(leveledRaw, resolved.classes);
        let cantrips = filterSpellsByClasses(cantripsRaw, resolved.classes);

        // Apply legacy exclusion if requested (default true from client)
        if (parsed.excludeLegacy) {
            const isLegacySchool = (s: unknown) =>
                String(s || "")
                    .trim()
                    .toLowerCase() === "legacy";
            leveled = leveled.filter((s) => !isLegacySchool(s.school));
            cantrips = cantrips.filter((s) => !isLegacySchool(s.school));
        }

        // Determine character level (max of levels, clamped 1..20)
        const characterLevel = clampNumber(
            Math.max(
                ...(resolved.levels || [])
                    .map((n) => toNumber(n))
                    .filter((n) => n >= 0)
            ),
            1,
            20
        );

        // Single-class selection (resolveOptions enforces min/max:1)
        const playerClass = resolved.classes?.[0] ?? "";

        // Determine targets upfront (avoid post-selection removal)
        let overrides: { cantripsTarget?: number; spellsTarget?: number } = {};
        try {
            const { uid } = await getAuthAndSaveEligibility();
            const extraExpr = await fetchUserExtraDice(uid);
            overrides = computeAdjustedTargets(
                playerClass,
                characterLevel,
                extraExpr
            );
        } catch {}

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
        // Auth + eligibility
        const auth = await getAuthAndSaveEligibility();

        // Parse incoming form
        const parsed = parseFormDataToOptions(formData);

        // Resolve "random" tokens to concrete values
        const resolved = resolveOptions(
            parsed.level,
            parsed.schools,
            parsed.classes
        );

        // Fetch leveled spells and cantrips separately, then filter by class
        const [leveledRaw, cantripsRaw] = await Promise.all([
            fetchSpells(resolved.levels, resolved.schools, parsed.sourceShorts),
            fetchCantrips(resolved.schools, parsed.sourceShorts),
        ]);
        let leveled = filterSpellsByClasses(leveledRaw, resolved.classes);
        let cantrips = filterSpellsByClasses(cantripsRaw, resolved.classes);

        // Apply legacy exclusion if requested (default true from client)
        if (parsed.excludeLegacy) {
            const isLegacySchool = (s: unknown) =>
                String(s || "")
                    .trim()
                    .toLowerCase() === "legacy";
            leveled = leveled.filter((s) => !isLegacySchool(s.school));
            cantrips = cantrips.filter((s) => !isLegacySchool(s.school));
        }

        // Determine character level (max of levels, clamped 1..20)
        const characterLevel = clampNumber(
            Math.max(
                ...(resolved.levels || [])
                    .map((n) => toNumber(n))
                    .filter((n) => n >= 0)
            ),
            1,
            20
        );

        // Single-class selection (resolveOptions enforces min/max:1)
        const playerClass = resolved.classes?.[0] ?? "";

        // Determine targets upfront (avoid post-selection removal)
        let overrides: { cantripsTarget?: number; spellsTarget?: number } = {};
        try {
            const extraExpr = await fetchUserExtraDice(auth.uid);
            overrides = computeAdjustedTargets(
                playerClass,
                characterLevel,
                extraExpr
            );
        } catch {}

        const spellbook = selectSpellsForSpellbook(
            cantrips,
            leveled,
            playerClass,
            characterLevel,
            overrides
        );

        // cantrips are level 0 spells in the spells object
        // artificer prepared spells is equal to int mod + half level rounded down

        if (process.env.VV_DEBUG) {
            // eslint-disable-next-line no-console
            console.log("generateSpellbook — resolved options:", {
                level: parsed.level,
                charLevel: characterLevel,
                schools: resolved.schools,
                classes: resolved.classes,
                initialLeveled: leveledRaw.length,
                initialCantrips: cantripsRaw.length,
                finalLeveled: leveled.length,
                finalCantrips: cantrips.length,
                spellbook: spellbook.length,
                canSave: auth.canSave,
            });
        }

        // Persist for premium, logged-in users
        if (auth.canSave && auth.userIdForSave) {
            const id = await saveSpellbookRecord({
                userId: auth.userIdForSave,
                spells: spellbook,
                options: {
                    level: parsed.level,
                    schools: resolved.schools,
                    classes: resolved.classes,
                    sourceShorts: parsed.sourceShorts,
                    excludeLegacy: parsed.excludeLegacy,
                },
                formData,
            });
            return id;
        }

        // Otherwise return spells payload
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
    } catch (err) {
        if (process.env.VV_DEBUG) {
            // eslint-disable-next-line no-console
            console.error("generateSpellbook error:", err);
        }
        throw err;
    }
}

/**
 * Helpers (kept below the main function)
 */

function selectSpellsForSpellbook(
    cantrips: Dnd5eSpell[],
    leveledSpells: Dnd5eSpell[],
    playerClass: string,
    characterLevel: number,
    overrides?: { cantripsTarget?: number; spellsTarget?: number }
): Dnd5eSpell[] {
    const classKey = toTitleCase(playerClass ?? "");
    const classTable = (SPELLS_PER_LEVEL as any)?.[classKey];
    if (!classTable) return [...cantrips, ...leveledSpells];

    const row = classTable[String(characterLevel)] ?? classTable["20"];
    if (!row) return [...cantrips, ...leveledSpells];

    // Targets from SPELLS_PER_LEVEL
    const cantripsTarget = Math.max(
        overrides?.cantripsTarget ?? row.cantrips ?? 0,
        0
    );
    const maxSpellLevel =
        typeof row.maxSpellLevel === "number" && row.maxSpellLevel >= 0
            ? row.maxSpellLevel
            : 9;

    // Artificer prepared spells: INT mod (1..5 random) + floor(level/2)
    const spellsTargetRaw =
        row.spells == null
            ? 1 + Math.floor(Math.random() * 5) + Math.floor(characterLevel / 2)
            : Math.max(Number(row.spells) || 0, 0);
    const spellsTarget = Math.max(
        overrides?.spellsTarget ?? spellsTargetRaw,
        0
    );

    // Dedupe pools and enforce max level
    const cantripsPool = dedupeBy(
        cantrips.filter((s) => toNumber(s.level) === 0),
        (s) => s.dndbeyondId || s.slug || s.name || ""
    );

    const leveledPool = dedupeBy(
        leveledSpells.filter((s) => {
            const lvl = toNumber(s.level);
            return lvl > 0 && lvl <= maxSpellLevel;
        }),
        (s) => s.dndbeyondId || s.slug || s.name || ""
    );

    // Select (Policy D: do not relax filters; return fewer if short)
    const chosenCantrips = takeRandom(cantripsPool, cantripsTarget);
    const chosenLeveled = takeRandom(leveledPool, spellsTarget);

    const selected = [...chosenCantrips, ...chosenLeveled];

    // Stable ordering: level asc, then name asc
    selected.sort((a, b) => {
        const la = toNumber(a.level);
        const lb = toNumber(b.level);
        if (la !== lb) return la - lb;
        return (a.name || "").localeCompare(b.name || "");
    });

    return selected;
}
// Pick extra spells from the remaining pool, respecting max spell level for the class
function pickExtraSpells(
    cantrips: Dnd5eSpell[],
    leveledSpells: Dnd5eSpell[],
    alreadySelected: Dnd5eSpell[],
    playerClass: string,
    characterLevel: number,
    extraCount: number
): Dnd5eSpell[] {
    if (!extraCount) return [];

    const classKey = toTitleCase(playerClass ?? "");
    const classTable = (SPELLS_PER_LEVEL as any)?.[classKey];
    const row = classTable
        ? classTable[String(characterLevel)] ?? classTable["20"]
        : null;
    const maxSpellLevel =
        row && typeof row.maxSpellLevel === "number" && row.maxSpellLevel >= 0
            ? row.maxSpellLevel
            : 9;

    const idKey = (s: Dnd5eSpell) => s.dndbeyondId || s.slug || s.name || "";
    const selectedKeys = new Set(alreadySelected.map(idKey).filter(Boolean));

    const cantripsPool = dedupeBy(
        cantrips.filter((s) => toNumber(s.level) === 0),
        idKey
    ).filter((s) => !selectedKeys.has(idKey(s)));

    const leveledPool = dedupeBy(
        leveledSpells.filter((s) => {
            const lvl = toNumber(s.level);
            return lvl > 0 && lvl <= maxSpellLevel;
        }),
        idKey
    ).filter((s) => !selectedKeys.has(idKey(s)));

    const pool = [...cantripsPool, ...leveledPool];
    return takeRandom(pool, extraCount);
}

// Compute adjusted targets (cantrips and leveled) given a modifier string
function computeAdjustedTargets(
    playerClass: string,
    characterLevel: number,
    modifier: string | null | undefined
): { cantripsTarget: number; spellsTarget: number } {
    const classKey = toTitleCase(playerClass ?? "");
    const classTable = (SPELLS_PER_LEVEL as any)?.[classKey];
    const row = classTable
        ? classTable[String(characterLevel)] ?? classTable["20"]
        : null;
    const baseCantrips = Math.max(row?.cantrips ?? 0, 0);
    const baseSpells = Math.max(
        row?.spells == null
            ? 1 + Math.floor(Math.random() * 5) + Math.floor(characterLevel / 2)
            : Number(row?.spells) || 0,
        0
    );
    const baseTotal = baseCantrips + baseSpells;

    const raw = String(modifier ?? "").trim();
    if (!raw) return { cantripsTarget: baseCantrips, spellsTarget: baseSpells };

    let targetTotal = baseTotal;
    const mulDiv = raw.match(/^([*\/])\s*(\d+(?:\.\d+)?)$/);
    if (mulDiv) {
        const op = mulDiv[1];
        const k = Math.max(0.0001, Math.min(parseFloat(mulDiv[2]), 10));
        targetTotal =
            op === "*" ? Math.floor(baseTotal * k) : Math.floor(baseTotal / k);
    } else if (/^[+-]?\s*\d+$/.test(raw)) {
        targetTotal = Math.max(
            0,
            baseTotal + parseInt(raw.replace(/\s+/g, ""), 10)
        );
    } else {
        targetTotal = Math.max(0, baseTotal + rollDiceExpression(raw));
    }

    if (baseTotal <= 0) {
        return { cantripsTarget: 0, spellsTarget: targetTotal };
    }
    const ratio = targetTotal / baseTotal;
    const newCantrips = Math.max(0, Math.floor(baseCantrips * ratio));
    const newLeveled = Math.max(0, targetTotal - newCantrips);
    return { cantripsTarget: newCantrips, spellsTarget: newLeveled };
}

// toNumber, clampNumber, takeRandom, dedupeBy imported from utils

// getAuthAndSaveEligibility imported from shared server/auth

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
                    // classes: { $in: classes }, // Not supported by the backend
                },
            },
        },
    };

    const res = await dbQuery<{ dnd5e_spells?: Dnd5eSpell[] }>(query);
    const spells: Dnd5eSpell[] = res?.dnd5e_spells ?? [];
    return spells;
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
    const spells: Dnd5eSpell[] = res?.dnd5e_spells ?? [];
    return spells;
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
