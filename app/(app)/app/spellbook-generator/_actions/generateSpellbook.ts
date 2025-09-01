/** @format */

// app/spellbook-generator/_actions/generateSpellbook.ts

"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { resolveLevel, resolveSelections } from "../_functions/helpers";
import { CLASSES, SCHOOLS } from "@/lib/5e-data";
import dbServer from "@/server/db-server";

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
                spellClass.toUpperCase().startsWith(playerClass.toUpperCase())
            )
        )
    );

    console.log("generateSpellbook — resolved options:", {
        level,
        schools,
        classes,
        initialLength,
        finalLength: spells.length,
        // candidateCount: candidates.length,
        // filteredCount: filteredCandidates.length,
    });

    revalidatePath("/");
    redirect("/");
}
