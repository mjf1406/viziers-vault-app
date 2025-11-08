/** @format */

import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { init, lookup, id } from "@instantdb/admin";
import { parseLevel, parseCR } from "./helpers";
import _schema from "@/instant.schema";

const db = init({
    appId: "319a811a-4789-48f2-a393-ad5010eb0386",
    adminToken: "4d5c6cb0-1f4f-4a70-a5de-e4bf3741201f",
    schema: _schema,
});

const DATA_DIR = path.resolve(process.cwd(), "stuff", "data");

const FILES = {
    magicitems: path.join(DATA_DIR, "dndbeyond-magicitems-data.csv"),
    spells: path.join(DATA_DIR, "dndbeyond-spells-data.csv"),
    monsters: path.join(DATA_DIR, "dndbeyond-monsters-data.csv"),
};

type Rec = Record<string, string>;
type Entity = "dnd5e_magicItems" | "dnd5e_spells" | "dnd5e_bestiary";

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

function stripOuterQuotes(s?: string): string | undefined {
    if (!s) return undefined;
    const t = s.trim();
    const isQuoted =
        (t.startsWith('"') && t.endsWith('"')) ||
        (t.startsWith("'") && t.endsWith("'"));
    return isQuoted ? t.slice(1, -1) : t;
}

function splitList(input?: string, delimiter = /[;,]/g): string[] | undefined {
    if (!input) return undefined;
    const arr = input
        .split(delimiter)
        .map((s) => s.trim())
        .filter(Boolean);
    return arr.length ? arr : undefined;
}

function isLookupValidation(err: any): boolean {
    const msg: string = err?.body?.message || err?.message || String(err || "");
    const dtype = err?.body?.hint?.["data-type"];
    return (
        dtype === "lookup" ||
        msg.includes(
            "Updates with lookups can only update the lookup attribute"
        )
    );
}

function isUniqueViolation(err: any): boolean {
    const msg: string = err?.body?.message || err?.message || String(err || "");
    return /unique/i.test(msg) || /constraint/i.test(msg);
}

async function upsertRow(
    etype: Entity,
    dndId: string,
    updatePayload: Record<string, any>,
    createPayload: Record<string, any>
) {
    // 1) Try update via lookup (do NOT include dndbeyondId here)
    try {
        const tx = (db.tx as any)[etype][lookup("dndbeyondId", dndId)].update(
            updatePayload
        );
        await db.transact([tx]);
        return;
    } catch (err: any) {
        // 2) Fallback to create with random id, including dndbeyondId
        if (!isLookupValidation(err)) {
            // Not a lookup auto-create limitation; bubble up
            throw err;
        }
        try {
            const tx = (db.tx as any)[etype][id()].create(createPayload);
            await db.transact([tx]);
            return;
        } catch (err2: any) {
            // 3) If create hit a unique race, retry update
            if (isUniqueViolation(err2)) {
                const tx = (db.tx as any)[etype][
                    lookup("dndbeyondId", dndId)
                ].update(updatePayload);
                await db.transact([tx]);
                return;
            }
            throw err2;
        }
    }
}

async function upsertMagicItems(filePath: string) {
    if (!fileExists(filePath)) {
        console.warn(`Skipping magic items; file not found: ${filePath}`);
        return;
    }

    const rows = readCsv(filePath);
    let count = 0;

    for (const r of rows) {
        const dndId = String(r.ID || "").trim();
        if (!dndId) continue;

        const base = omitEmpty({
            name: r.NAME,
            rarity: r.RARITY,
            type: r.TYPE,
            attunement: r.ATTUNEMENT,
            notes: r.NOTES,
            source: r.SOURCE,
            url: r.URL,
            updatedAt: new Date(),
        });

        await upsertRow(
            "dnd5e_magicItems",
            dndId,
            base, // update payload (no dndbeyondId)
            { dndbeyondId: dndId, ...base } // create payload (includes dndbeyondId)
        );

        count++;
        if (count % 200 === 0) console.log(`Magic items: ${count}`);
    }
    console.log(`Magic items done. Total: ${count}`);
}

async function upsertSpells(filePath: string) {
    if (!fileExists(filePath)) {
        console.warn(`Skipping spells; file not found: ${filePath}`);
        return;
    }

    const rows = readCsv(filePath);
    let count = 0;

    for (const r of rows) {
        const dndId = String(r.ID || "").trim();
        if (!dndId) continue;

        const levelText = r.LEVEL?.trim();
        const classesArr = splitList(r.CLASSES);

        const base = omitEmpty({
            slug: r.NAME, // NAME in your sample is the slug
            name: r.NAME,
            description: r.DESCRIPTION,
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
            classes: classesArr, // array (schema must be i.json())
            source: r.SOURCE,
            url: r.URL,
            updatedAt: new Date(),
        });

        await upsertRow("dnd5e_spells", dndId, base, {
            dndbeyondId: dndId,
            ...base,
        });

        count++;
        if (count % 200 === 0) console.log(`Spells: ${count}`);
    }
    console.log(`Spells done. Total: ${count}`);
}

async function upsertMonsters(filePath: string) {
    if (!fileExists(filePath)) {
        console.warn(`Skipping monsters; file not found: ${filePath}`);
        return;
    }

    const rows = readCsv(filePath);
    let count = 0;

    for (const r of rows) {
        const dndId = String(r.ID || "").trim();
        if (!dndId) continue;

        const crText = r.CR?.trim();
        const name = stripOuterQuotes(r.NAME);

        const base = omitEmpty({
            name,
            crText,
            cr: parseCR(crText),
            type: r.TYPE,
            size: r.SIZE,
            alignment: r.ALIGNMENT,
            habitat: r.HABITAT,
            source: r.SOURCE,
            url: r.URL,
            updatedAt: new Date(),
        });

        await upsertRow("dnd5e_bestiary", dndId, base, {
            dndbeyondId: dndId,
            ...base,
        });

        count++;
        if (count % 200 === 0) console.log(`Monsters: ${count}`);
    }
    console.log(`Monsters done. Total: ${count}`);
}

async function main() {
    console.log("This will take about 25 minutes.");
    console.time("upsert");
    await upsertMagicItems(FILES.magicitems);
    await upsertSpells(FILES.spells);
    await upsertMonsters(FILES.monsters);
    console.timeEnd("upsert");
}

main().catch((err) => {
    console.error(
        "Fatal:",
        err?.body ? JSON.stringify(err.body, null, 2) : err
    );
    process.exit(1);
});
