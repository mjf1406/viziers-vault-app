/** @format */

// app/spellbook-generator/_actions/generateSpellbook.ts

"use server";

import {
    FisherYatesShuffle,
    resolveLevel,
    resolveSelections,
    toTitleCase,
} from "../_functions/helpers";
import { CLASSES, SCHOOLS, SPELLS_PER_LEVEL } from "@/lib/5e-data";
import dbServer from "@/server/db-server";
import { cookies } from "next/headers";
import { verifyHint } from "@/lib/hint";
import { randomUUID } from "crypto";

type GenerateOpts = {
    level: number | "random";
    schools: string[] | "random";
    classes: string[] | "random";
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
          };
      };

type AllowedPlan = "free" | "basic" | "plus" | "pro";

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
            fetchSpells(resolved.levels, resolved.schools),
            fetchCantrips(resolved.schools),
        ]);
        const leveled = filterSpellsByClasses(leveledRaw, resolved.classes);
        const cantrips = filterSpellsByClasses(cantripsRaw, resolved.classes);

        // Determine character level (max of levels, clamped 1..20)
        const characterLevel = clamp(
            Math.max(
                ...(resolved.levels || [])
                    .map((n) => toNum(n))
                    .filter((n) => n >= 0)
            ),
            1,
            20
        );

        // Single-class selection (resolveOptions enforces min/max:1)
        const playerClass = resolved.classes?.[0] ?? "";

        const spellbook = selectSpellsForSpellbook(
            cantrips,
            leveled,
            playerClass,
            characterLevel
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
    characterLevel: number
): Dnd5eSpell[] {
    const classKey = toTitleCase(playerClass ?? "");
    const classTable = (SPELLS_PER_LEVEL as any)?.[classKey];
    if (!classTable) return [...cantrips, ...leveledSpells];

    const row = classTable[String(characterLevel)] ?? classTable["20"];
    if (!row) return [...cantrips, ...leveledSpells];

    // Targets from SPELLS_PER_LEVEL
    const cantripsTarget = Math.max(row.cantrips ?? 0, 0);
    const maxSpellLevel =
        typeof row.maxSpellLevel === "number" && row.maxSpellLevel >= 0
            ? row.maxSpellLevel
            : 9;

    // Artificer prepared spells: INT mod (1..5 random) + floor(level/2)
    const spellsTarget =
        row.spells == null
            ? 1 + Math.floor(Math.random() * 5) + Math.floor(characterLevel / 2)
            : Math.max(Number(row.spells) || 0, 0);

    // Dedupe pools and enforce max level
    const cantripsPool = dedupeBy(
        cantrips.filter((s) => toNum(s.level) === 0),
        (s) => s.dndbeyondId || s.slug || s.name || ""
    );

    const leveledPool = dedupeBy(
        leveledSpells.filter((s) => {
            const lvl = toNum(s.level);
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
        const la = toNum(a.level);
        const lb = toNum(b.level);
        if (la !== lb) return la - lb;
        return (a.name || "").localeCompare(b.name || "");
    });

    return selected;
}

function toNum(v: unknown): number {
    const n = typeof v === "number" ? v : parseInt(String(v || 0), 10);
    return Number.isFinite(n) ? n : 0;
}

function clamp(n: number, min: number, max: number): number {
    return Math.min(Math.max(n, min), max);
}

function takeRandom<T>(arr: T[], count: number): T[] {
    if (count <= 0) return [];
    if (!arr || arr.length === 0) return [];
    const n = Math.min(count, arr.length);
    return FisherYatesShuffle(arr).slice(0, n);
}

function dedupeBy<T>(arr: T[], keyFn: (t: T) => string): T[] {
    const seen = new Set<string>();
    const out: T[] = [];
    for (const item of arr) {
        const k = keyFn(item);
        if (!k) continue;
        if (seen.has(k)) continue;
        seen.add(k);
        out.push(item);
    }
    return out;
}

async function getAuthAndSaveEligibility(): Promise<{
    uid: string;
    canSave: boolean;
    userIdForSave: string | null;
    tier: string | null;
}> {
    // Verify via signed vv_hint cookie (non-blocking for generation)
    const cookieStore = await cookies();
    const hintRaw = cookieStore.get("vv_hint")?.value ?? "";
    const secret = process.env.VV_COOKIE_SECRET || "";
    const hint = secret && hintRaw ? await verifyHint(hintRaw, secret) : null;
    const uid = hint?.uid ?? "";

    if (process.env.VV_DEBUG) {
        // eslint-disable-next-line no-console
        console.log("generateSpellbook uid=", uid, "tier=", hint?.tier);
    }

    // Fetch user + plan; if missing, still allow generation but do not save
    let canSave = false;
    let userIdForSave: string | null = null;
    let tier: AllowedPlan | null = null;

    try {
        if (uid) {
            const users = await dbServer.query({
                $users: { $: { where: { id: uid } }, profile: {} },
            });
            const userInfo = users?.$users?.[0];
            const planRaw = userInfo?.profile?.plan;
            // Narrow unknown '{}' from the DB shape to our allowed plan values
            tier =
                typeof planRaw === "string" &&
                (["free", "basic", "plus", "pro"] as const).includes(
                    planRaw as AllowedPlan
                )
                    ? (planRaw as AllowedPlan)
                    : null;

            const isPremium =
                tier === "basic" || tier === "plus" || tier === "pro";
            canSave = Boolean(uid) && isPremium;
            userIdForSave = uid;
        }
    } catch (_e) {
        // Non-fatal: treat as anonymous/no-save
        canSave = false;
        userIdForSave = null;
    }

    return { uid, canSave, userIdForSave, tier };
}

function parseFormDataToOptions(formData: FormData): {
    level: GenerateOpts["level"];
    schools: GenerateOpts["schools"];
    classes: GenerateOpts["classes"];
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

    const nameRaw = formData.get("name");
    const name = typeof nameRaw === "string" ? nameRaw.trim() : undefined;

    return { level, schools, classes, name };
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

async function fetchSpells(
    levels: number[],
    schools: string[]
): Promise<Dnd5eSpell[]> {
    const query = {
        dnd5e_spells: {
            $: {
                where: {
                    level: { $in: levels },
                    school: { $in: schools },
                    // classes: { $in: classes }, // Not supported by the backend
                },
            },
        },
    };

    const res = await dbQuery<{ dnd5e_spells?: Dnd5eSpell[] }>(query);
    const spells: Dnd5eSpell[] = res?.dnd5e_spells ?? [];
    return spells;
}

async function fetchCantrips(schools: string[]): Promise<Dnd5eSpell[]> {
    const query = {
        dnd5e_spells: {
            $: {
                where: {
                    level: { $in: [0] },
                    school: { $in: schools },
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
