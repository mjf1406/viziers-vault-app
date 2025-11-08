/** @format */

// stuff\scripts\updateSpellComponentCosts.ts

import { init } from "@instantdb/admin";
import fs from "node:fs";
import path from "node:path";
import _schema from "@/instant.schema";

const db = init({
    appId: "319a811a-4789-48f2-a393-ad5010eb0386",
    adminToken: "4d5c6cb0-1f4f-4a70-a5de-e4bf3741201f",
    schema: _schema,
});

type Spell = {
    id: string;
    name?: string;
    materialComponents?: string | null;
    componentCost?: number | null;
};

type ParsedCost = {
    totalGp?: number;
    unresolvedReason?: string;
    matchedCurrency: boolean;
};

const OUTPUT_DIR = path.resolve(process.cwd(), "stuff", "output");
const UNRESOLVED_CSV = path.join(
    OUTPUT_DIR,
    "unresolved_spell_component_costs.csv"
);

const CURRENCY_TO_GP: Record<string, number> = {
    gp: 1,
    pp: 10,
    sp: 0.1,
    cp: 0.01,
    ep: 0.5, // electrum
};

const NUMBER_WORDS: Record<string, number> = {
    a: 1,
    an: 1,
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
    eleven: 11,
    twelve: 12,
    dozen: 12,
    "half-dozen": 6,
    pair: 2,
    couple: 2,
    score: 20,
};

function normalizeText(input: string): string {
    return input
        .replace(/[–—]/g, "-")
        .replace(/\s+/g, " ")
        .replace(/\.(?=\S)/g, ". ")
        .trim()
        .toLowerCase();
}

function parseQuantityNear(text: string, index: number): number | undefined {
    // Look up to 50 chars before the currency amount for a quantity word or number
    const start = Math.max(0, index - 50);
    const window = text.slice(start, index);
    // Prefer explicit numbers first
    const numMatch = window.match(/(\d+)(?=[^\d]*?(?:each|of|\b))/);
    if (numMatch) {
        const n = Number(numMatch[1]);
        if (Number.isFinite(n) && n > 0) return n;
    }
    // Then try number words
    const words = window.split(/[^a-z-]+/).filter(Boolean);
    for (let i = words.length - 1; i >= 0; i--) {
        const w = words[i];
        if (NUMBER_WORDS[w] != null) return NUMBER_WORDS[w];
    }
    return undefined;
}

function hasTotalQualifier(text: string, matchIndex: number): boolean {
    // If the phrase near the amount contains 'total' we should not multiply by quantity
    const end = Math.min(text.length, matchIndex + 30);
    const near = text.slice(Math.max(0, matchIndex - 15), end);
    return /total/.test(near);
}

function parseComponentCost(input?: string | null): ParsedCost {
    if (!input || !input.trim()) {
        return { matchedCurrency: false };
    }
    const text = normalizeText(input);

    // Detect any currency markers first
    const anyCurrency =
        /(\d|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|dozen|pair|couple|half-dozen)[^a-z]*(?:pp|gp|sp|cp|ep|platinum|gold|silver|copper|electrum)/i.test(
            text
        );

    let total = 0;
    let foundAny = false;
    let unresolvedReason: string | undefined;

    const addAmount = (amountGp: number) => {
        if (Number.isFinite(amountGp)) {
            total += amountGp;
            foundAny = true;
        }
    };

    // 1) Ranges like "50-100 gp" or "50 to 100 gp" -> take the minimum
    const rangeRegex =
        /(\d+(?:\.\d+)?)\s*(?:-|to)\s*(\d+(?:\.\d+)?)\s*(pp|gp|sp|cp|ep)\b/g;
    for (const m of text.matchAll(rangeRegex)) {
        const a = Number(m[1]);
        const unit = m[3] as keyof typeof CURRENCY_TO_GP;
        const factor = CURRENCY_TO_GP[unit];
        addAmount(Math.min(a, Number(m[2])) * factor);
    }

    // 2) Thresholds like "at least 100 gp" or "100+ gp" -> take the specified amount
    const thresholdRegex =
        /(?:at least|minimum of|no less than)\s*(\d+(?:\.\d+)?)\s*(pp|gp|sp|cp|ep)\b/g;
    for (const m of text.matchAll(thresholdRegex)) {
        addAmount(
            Number(m[1]) * CURRENCY_TO_GP[m[2] as keyof typeof CURRENCY_TO_GP]
        );
    }
    const plusRegex = /(\d+(?:\.\d+)?)\s*\+\s*(pp|gp|sp|cp|ep)\b/g;
    for (const m of text.matchAll(plusRegex)) {
        addAmount(
            Number(m[1]) * CURRENCY_TO_GP[m[2] as keyof typeof CURRENCY_TO_GP]
        );
    }

    // 3) Plain amounts (including parenthetical) like "(10 gp)" or "25 gp each"
    const plainRegex = /(\d+(?:\.\d+)?)\s*(pp|gp|sp|cp|ep)\b/g;
    for (const m of text.matchAll(plainRegex)) {
        const value = Number(m[1]);
        const unit = m[2] as keyof typeof CURRENCY_TO_GP;
        const idx = m.index ?? 0;
        const base = value * CURRENCY_TO_GP[unit];

        // Handle "each" multiplier if present nearby and not marked as total
        const tail = text.slice(idx, Math.min(text.length, idx + 40));
        const hasEach = /each\b/.test(tail);
        const isTotal = hasTotalQualifier(text, idx);

        if (hasEach && !isTotal) {
            const qty = parseQuantityNear(text, idx);
            if (qty == null) {
                // Ambiguous: mentions "each" but quantity missing
                unresolvedReason =
                    unresolvedReason || "contains 'each' with no quantity";
                // Skip multiplication to avoid overcounting
                addAmount(base);
            } else {
                addAmount(base * qty);
            }
        } else {
            addAmount(base);
        }
    }

    // 4) "worth" constructions that may omit explicit unit directly next to number
    // e.g., "two gems worth 50 gp each"
    const worthRegex =
        /worth\s*(?:at least\s*)?(\d+(?:\.\d+)?)\s*(pp|gp|sp|cp|ep)\b/g;
    for (const m of text.matchAll(worthRegex)) {
        const value = Number(m[1]);
        const unit = m[2] as keyof typeof CURRENCY_TO_GP;
        const idx = m.index ?? 0;
        const base = value * CURRENCY_TO_GP[unit];
        const hasEach = /each\b/.test(text.slice(idx, idx + 40));
        const isTotal = hasTotalQualifier(text, idx);
        if (hasEach && !isTotal) {
            const qty = parseQuantityNear(text, idx);
            if (qty == null) {
                unresolvedReason =
                    unresolvedReason || "contains 'each' with no quantity";
                addAmount(base);
            } else {
                addAmount(base * qty);
            }
        } else {
            addAmount(base);
        }
    }

    if (!anyCurrency) {
        return { matchedCurrency: false };
    }

    if (foundAny && total > 0) {
        return { matchedCurrency: true, totalGp: roundToTwo(total) };
    }

    // Currency mentioned but we couldn't compute a reliable cost
    if (!unresolvedReason) {
        if (
            /variable|varies|price varies|see text|dm(?:'|’)?s discretion/.test(
                text
            )
        ) {
            unresolvedReason = "variable price";
        } else if (/or more|or higher/.test(text)) {
            // We tried to grab minimums above; if still nothing matched, mark unresolved
            unresolvedReason = "open-ended minimum";
        } else {
            unresolvedReason = "could not parse numeric cost";
        }
    }
    return { matchedCurrency: true, unresolvedReason };
}

function roundToTwo(n: number): number {
    return Math.round(n * 100) / 100;
}

async function fetchAllSpells(): Promise<Spell[]> {
    const data = await db.query({ dnd5e_spells: {} });
    return (data?.dnd5e_spells || []) as Spell[];
}

async function updateComponentCosts() {
    console.time("update-spell-component-costs");

    const spells = await fetchAllSpells();
    console.log(`Fetched ${spells.length} spells.`);

    const toUpdate: Array<{ id: string; componentCost: number }> = [];
    const unresolved: Array<{
        id: string;
        name: string;
        materialComponents: string;
        reason: string;
    }> = [];

    let skippedExisting = 0;
    let skippedNoCurrency = 0;

    for (const s of spells) {
        if (s.componentCost != null) {
            skippedExisting++;
            continue; // leave existing values unchanged
        }
        const m = (s.materialComponents || "").trim();
        if (!m) {
            continue; // nothing to parse
        }

        const parsed = parseComponentCost(m);
        if (!parsed.matchedCurrency) {
            skippedNoCurrency++;
            continue;
        }
        if (parsed.totalGp != null) {
            toUpdate.push({ id: s.id, componentCost: parsed.totalGp });
        } else {
            unresolved.push({
                id: s.id,
                name: s.name || "",
                materialComponents: m,
                reason: parsed.unresolvedReason || "unknown",
            });
        }
    }

    console.log(
        `Prepared ${toUpdate.length} updates. Skipped existing: ${skippedExisting}. Skipped no-currency: ${skippedNoCurrency}. Unresolved: ${unresolved.length}.`
    );

    // Apply updates in batches
    const BATCH = 100;
    let applied = 0;
    for (let i = 0; i < toUpdate.length; i += BATCH) {
        const batch = toUpdate.slice(i, i + BATCH);
        const txs = batch.map((u) =>
            (db.tx as any).dnd5e_spells[u.id].update({
                componentCost: u.componentCost,
                updatedAt: new Date(),
            })
        );
        await db.transact(txs);
        applied += batch.length;
        console.log(`Applied ${applied}/${toUpdate.length} updates...`);
    }

    // Write unresolved CSV
    if (unresolved.length > 0) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        const header = ["id", "name", "materialComponents", "reason"].join(",");
        const rows = unresolved.map((u) =>
            [
                csvEscape(u.id),
                csvEscape(u.name),
                csvEscape(u.materialComponents),
                csvEscape(u.reason),
            ].join(",")
        );
        fs.writeFileSync(UNRESOLVED_CSV, [header, ...rows].join("\n"), "utf8");
        console.log(
            `Wrote ${unresolved.length} unresolved rows to: ${UNRESOLVED_CSV}`
        );
    } else {
        console.log("No unresolved rows.");
    }

    console.timeEnd("update-spell-component-costs");
}

function csvEscape(s: string): string {
    const needsQuotes = /[",\n]/.test(s);
    const escaped = s.replace(/"/g, '""');
    return needsQuotes ? `"${escaped}"` : escaped;
}

updateComponentCosts().catch((err) => {
    console.error(
        "Fatal:",
        err?.body ? JSON.stringify(err.body, null, 2) : err
    );
    process.exit(1);
});
