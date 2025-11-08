/** @format */
// stuff\scripts\insertSpells.ts

import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { init, lookup, id } from "@instantdb/admin";
import { parseLevel } from "./helpers";
import _schema from "@/instant.schema";

const db = init({
    appId: "319a811a-4789-48f2-a393-ad5010eb0386",
    adminToken: "4d5c6cb0-1f4f-4a70-a5de-e4bf3741201f",
    schema: _schema,
});

const DATA_DIR = path.resolve(process.cwd(), "stuff", "data", "5etools");

const FILES = {
    spells: path.join(DATA_DIR, "spells.csv"),
};

type Rec = Record<string, string>;

function fileExists(filePath: string): boolean {
    try {
        fs.accessSync(filePath, fs.constants.R_OK);
        return true;
    } catch {
        return false;
    }
}

function readCsv(filePath: string): Rec[] {
    const csv = fs.readFileSync(filePath, "utf8");
    return parse(csv, { columns: true, skip_empty_lines: true }) as Rec[];
}

function isNonEmpty(value: unknown): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === "string") return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return true;
}

function omitEmpty<T extends Record<string, unknown>>(obj: T): Partial<T> {
    const out: Partial<T> = {};
    for (const [k, v] of Object.entries(obj)) {
        if (isNonEmpty(v)) {
            // @ts-expect-error index
            out[k] = typeof v === "string" ? v.trim() : v;
        }
    }
    return out;
}

function parseJsonArray(input?: string): string[] | undefined {
    if (!input || input.trim() === "[]") return undefined;
    try {
        const parsed = JSON.parse(input);
        if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.filter(Boolean);
        }
    } catch {
        console.warn(`Failed to parse JSON array: ${input}`);
    }
    return undefined;
}

// async function deleteAllSpells() {
//     console.log("Deleting all spells...");

//     const { data } = await db.query({ dnd5e_spells: {} });
//     const spells = data.dnd5e_spells || [];

//     if (spells.length === 0) {
//         console.log("No spells to delete.");
//         return;
//     }

//     console.log(`Found ${spells.length} spells to delete.`);

//     // Delete in batches of 100
//     const batchSize = 100;
//     for (let i = 0; i < spells.length; i += batchSize) {
//         const batch = spells.slice(i, i + batchSize);
//         const txs = batch.map((spell: any) =>
//             (db.tx as any).dnd5e_spells[spell.id].delete()
//         );
//         await db.transact(txs);
//         console.log(
//             `Deleted ${Math.min(i + batchSize, spells.length)}/${spells.length}`
//         );
//     }

//     console.log("All spells deleted.");
// }

async function upsertSpells(filePath: string) {
    if (!fileExists(filePath)) {
        console.error(`Spells file not found: ${filePath}`);
        process.exit(1);
    }

    const rows = readCsv(filePath);
    console.log(`Found ${rows.length} spells in CSV.`);

    let count = 0;

    for (const r of rows) {
        const dndId = String(r.ID || "").trim();
        if (!dndId) {
            console.warn(`Skipping row with missing ID:`, r);
            continue;
        }

        const levelText = r.LEVEL?.trim();
        const classesArr = parseJsonArray(r.CLASSES);

        const spell = omitEmpty({
            dndbeyondId: dndId,
            name: r.NAME,
            nameLower: r.NAME_LOWER,
            slug: r.SLUG,
            levelText,
            level: parseLevel(levelText),
            castingTime: r.CASTING_TIME,
            range: r.RANGE,
            area: r.AREA,
            areaShape: r.AREA_SHAPE,
            components: r.COMPONENTS,
            materialComponents: r.MATERIAL_COMPONENTS,
            duration: r.DURATION,
            school: r.SCHOOL,
            attackSave: r.ATTACK_SAVE,
            damageEffect: r.DAMAGE_EFFECT,
            classes: classesArr,
            source: r.SOURCE,
            sourceShort: r.SOURCE_SHORT,
            url: r.URL,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        try {
            const tx = (db.tx as any).dnd5e_spells[id()].create(spell);
            await db.transact([tx]);
        } catch (err: any) {
            console.error(
                `Failed to insert spell ${r.NAME} (${dndId}):`,
                err?.body || err
            );
            throw err;
        }

        count++;
        if (count % 50 === 0) {
            console.log(`Inserted ${count}/${rows.length} spells...`);
        }
    }

    console.log(`✓ Spells done. Total: ${count}`);
}

async function main() {
    console.time("total");

    // await deleteAllSpells();
    await upsertSpells(FILES.spells);

    console.timeEnd("total");
}

main().catch((err) => {
    console.error(
        "Fatal:",
        err?.body ? JSON.stringify(err.body, null, 2) : err
    );
    process.exit(1);
});
