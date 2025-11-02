/** @format */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// -----------------------------
// Generic utilities (shared across features)
// -----------------------------

export function toTitleCase(s: string): string {
    return s
        .trim()
        .toLowerCase()
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function shuffleArray<T>(array: T[]): T[] {
    const shuffledArray = [...array];
    for (let i = shuffledArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = shuffledArray[i];
        shuffledArray[i] = shuffledArray[j];
        shuffledArray[j] = tmp;
    }
    return shuffledArray;
}

// Back-compat name used in spellbook helpers
export function FisherYatesShuffle<T>(array: T[]): T[] {
    return shuffleArray(array);
}

export function clampNumber(n: number, min: number, max: number): number {
    return Math.min(Math.max(n, min), max);
}

export function toNumber(v: unknown): number {
    const n = typeof v === "number" ? v : parseInt(String(v || 0), 10);
    return Number.isFinite(n) ? n : 0;
}

export function dedupeBy<T>(arr: T[], keyFn: (t: T) => string): T[] {
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

export function takeRandom<T>(arr: T[], count: number): T[] {
    if (count <= 0) return [];
    if (!arr || arr.length === 0) return [];
    const n = Math.min(count, arr.length);
    return shuffleArray(arr).slice(0, n);
}

export function resolveSelections<T extends string>(
    input: T[] | "random" | undefined,
    pool: readonly T[],
    opts?: { min?: number; max?: number }
): T[] {
    if (input === "random" || input == null) {
        const min = Math.max(1, opts?.min ?? 1);
        const max = Math.min(pool.length, opts?.max ?? pool.length);
        if (min > max) throw new Error("resolveSelections: invalid min/max");

        const count = Math.floor(Math.random() * (max - min + 1)) + min;
        return shuffleArray([...pool]).slice(0, count);
    }
    const unique = Array.from(new Set(input));
    return unique.filter((v) => pool.includes(v));
}

// -----------------------------
// Dice utilities
// -----------------------------

/**
 * Parse and roll a dice expression like:
 *  - 2d6
 *  - 2d6 + 3
 *  - 3d6 + 1d8 + 2
 * Supports + and - operators between terms. Whitespace is ignored.
 * Limits: up to 100 dice per term, die faces 2..1000, absolute flat +/- up to 100000.
 */
export function rollDiceExpression(expr: string | null | undefined): number {
    const raw = String(expr ?? "").trim();
    if (!raw) return 0;

    // Tokenize by + and - while preserving sign per term
    // Normalize spaces and leading +
    const normalized = raw.replace(/\s+/g, " ").trim();
    if (!normalized) return 0;

    // Split into terms with signs
    const terms: string[] = [];
    let buffer = "";
    for (let i = 0; i < normalized.length; i++) {
        const ch = normalized[i];
        if ((ch === "+" || ch === "-") && buffer.trim()) {
            terms.push(buffer.trim());
            buffer = ch;
        } else {
            buffer += ch;
        }
    }
    if (buffer.trim()) terms.push(buffer.trim());

    let total = 0;
    for (const term of terms) {
        const t = term.replace(/\s+/g, "");
        if (!t) continue;
        let sign = 1;
        let body = t;
        if (body[0] === "+") body = body.slice(1);
        else if (body[0] === "-") {
            sign = -1;
            body = body.slice(1);
        }

        // dice term like XdY
        const diceMatch = body.match(/^(\d*)d(\d+)$/i);
        if (diceMatch) {
            const count = Math.min(
                Math.max(parseInt(diceMatch[1] || "1", 10), 1),
                100
            );
            const faces = Math.min(
                Math.max(parseInt(diceMatch[2], 10), 2),
                1000
            );
            let subtotal = 0;
            for (let i = 0; i < count; i++) {
                subtotal += 1 + Math.floor(Math.random() * faces);
            }
            total += sign * subtotal;
            continue;
        }

        // flat number
        if (/^\d+$/.test(body)) {
            const val = Math.min(parseInt(body, 10), 100000);
            total += sign * val;
            continue;
        }

        // If unsupported token found, ignore it for safety
    }
    return total;
}
