/** @format */

// app/spellbook-generator/_actions/generateSpellbook.ts

"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { resolveLevel, resolveSelections } from "../_functions/helpers";
import { CLASSES, SCHOOLS } from "@/lib/5e-data";
import dbServer from "@/server/db-server";
import { cookies } from "next/headers";
import { verifyHint } from "@/lib/hint";

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

export default async function generateSpellbook(
    formData: FormData
): Promise<void> {
    try {
        // --- auth: verify via signed vv_hint cookie ---
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
        if (!uid) {
            throw new Error("Unauthorized: missing/invalid session");
        }

        const q = {
            $users: {
                $: { where: { id: uid } },
                profile: {},
            },
        };
        const users = await dbServer.query(q);
        const userInfo = users?.$users?.[0];
        if (process.env.VV_DEBUG) {
            // eslint-disable-next-line no-console
            console.log("generateSpellbook user fetched");
        }
        const authorized = userInfo.id === uid;
        const planMatch = userInfo.profile?.plan === hint?.tier;
        if (!authorized || !planMatch) {
            throw new Error("401 Unauthorized");
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
        console.log("🚀 ~ generateSpellbook ~ levels:", levels);
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
            });
        }
    } catch (err) {
        if (process.env.VV_DEBUG) {
            // eslint-disable-next-line no-console
            console.error("generateSpellbook error:", err);
        }
        throw err;
    }
}
