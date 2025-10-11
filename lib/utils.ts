/** @format */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Duration } from "@upstash/ratelimit";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatEveryDuration(window: Duration): string {
    const raw = String(window).trim();
    const match = raw.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)/);
    if (!match) return `every ${raw}`;
    const amount = Number(match[1]);
    const unitRaw = match[2].toLowerCase();
    const units: Record<string, { singular: string; plural: string }> = {
        ms: { singular: "millisecond", plural: "milliseconds" },
        s: { singular: "second", plural: "seconds" },
        sec: { singular: "second", plural: "seconds" },
        m: { singular: "minute", plural: "minutes" },
        min: { singular: "minute", plural: "minutes" },
        h: { singular: "hour", plural: "hours" },
        hr: { singular: "hour", plural: "hours" },
        d: { singular: "day", plural: "days" },
        day: { singular: "day", plural: "days" },
    };
    const unit = units[unitRaw];
    const label = unit ? (amount === 1 ? unit.singular : unit.plural) : unitRaw;
    return `every ${amount} ${label}`;
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
