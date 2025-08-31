/** @format */

"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { parse as parseCsv } from "csv-parse/sync";

export default async function generateSpellbook() {
    const res = await fetch(process.env.DND_BEYOND_SPELLS_FILE_URL!);
    if (!res.ok)
        throw new Error(
            `Failed to load spells: ${res.status} ${res.statusText}`
        );

    const csvText = await res.text();
    const spells = parseCsv(csvText, { columns: true, skip_empty_lines: true });
    console.log("Loaded spells:", spells);

    revalidatePath("/");
    redirect("/");
}
