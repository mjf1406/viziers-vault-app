/** @format */

// app/spellbook-generator/_actions/generateSpellbook.ts

"use server";
import { resolveLevel, resolveSelections } from "../_functions/helpers";
import { CLASSES, SCHOOLS } from "@/lib/5e-data";
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

export default async function generateSpellbook(
    formData: FormData
): Promise<SpellbookGenerateResponse> {
    try {
        // --- auth: verify via signed vv_hint cookie (non-blocking for generation) ---
        const cookieStore = await cookies();
        const hintRaw = cookieStore.get("vv_hint")?.value ?? "";
        const secret = process.env.VV_COOKIE_SECRET || "";
        const hint =
            secret && hintRaw ? await verifyHint(hintRaw, secret) : null;
        const uid = hint?.uid ?? "";
        if (process.env.VV_DEBUG) {
            // eslint-disable-next-line no-console
            console.log("generateSpellbook uid=", uid, "tier=", hint?.tier);
        }

        // Try to fetch user + plan. If missing, we still allow generation but will not save.
        let canSave = false;
        let userIdForSave: string | null = null;
        try {
            if (uid) {
                const users = await dbServer.query({
                    $users: { $: { where: { id: uid } }, profile: {} },
                });
                const userInfo = users?.$users?.[0];
                const tier = userInfo?.profile?.plan ?? null; // "free" | "basic" | "plus" | "pro" | null
                const isPremium = ["basic", "plus", "pro"].includes(
                    String(tier)
                );
                canSave = Boolean(uid) && isPremium;
                userIdForSave = uid;
            }
        } catch (e) {
            // Non-fatal: treat as anonymous/no-save
            canSave = false;
            userIdForSave = null;
        }

        // --- normalize form inputs ---
        const rawLevel = formData.get("level")?.toString() ?? "random";
        const level: GenerateOpts["level"] =
            rawLevel === "random" ? "random" : parseInt(rawLevel, 10);

        const schoolsIsRandom = formData.get("schools") === "random";
        let schools: GenerateOpts["schools"] = schoolsIsRandom
            ? "random"
            : formData.getAll("schools[]").map(String);

        const classesIsRandom = formData.get("classes") === "random";
        let classes: GenerateOpts["classes"] = classesIsRandom
            ? "random"
            : formData.getAll("classes[]").map(String);

        // Resolve "random" tokens into concrete values
        const levels = resolveLevel(level);
        schools = resolveSelections(schools, SCHOOLS);
        classes = resolveSelections(classes, CLASSES);

        const query = {
            dnd5e_spells: {
                $: {
                    where: {
                        level: { $in: levels },
                        school: { $in: schools },
                        // classes: { $in: classes },
                    },
                },
            },
        };

        // --- Run the query (admin wrapper returns namespaces directly) ---
        const res = await dbServer.query(query);
        let spells: Dnd5eSpell[] = res.dnd5e_spells as Dnd5eSpell[];
        const initialLength = spells.length;

        spells = spells.filter((spell) =>
            spell.classes?.some((spellClass) =>
                classes.some((playerClass) =>
                    spellClass
                        .toUpperCase()
                        .startsWith(playerClass.toUpperCase())
                )
            )
        );

        if (process.env.VV_DEBUG) {
            // eslint-disable-next-line no-console
            console.log("generateSpellbook — resolved options:", {
                level,
                schools,
                classes,
                initialLength,
                finalLength: spells.length,
                canSave,
            });
        }

        // --- Conditionally persist the generated spellbook for premium, logged-in users ---
        if (canSave && userIdForSave) {
            const id = randomUUID();
            const createdAt = new Date();
            const nameRaw = formData.get("name");
            const name =
                typeof nameRaw === "string" ? nameRaw.trim() : undefined;
            const record = {
                name: name || undefined,
                createdAt,
                options: { level, schools, classes },
                spellCount: spells.length,
                spells,
                creatorId: userIdForSave,
            } as any;

            await dbServer.transact(
                dbServer.tx.spellbooks[id]
                    .create(record)
                    .link({ $user: userIdForSave })
            );
            return id;
        }

        // If we didn't save (e.g., anonymous or free plan), return the spells and options
        return {
            spells,
            options: {
                level,
                schools: schools as string[],
                classes: classes as string[],
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
