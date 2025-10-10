/** @format */

// app/spellbook-generator/_functions/helpers.ts

import { MAX_LEVEL, MIN_LEVEL } from "@/lib/5e-data";

/**
 * Resolve a level input to a concrete level (1..20).
 * - If `level` is "random", undefined or invalid, returns a random int 1..20.
 * - If `level` is a number (or numeric string), clamps to 1..20 and returns it.
 */
export function resolveLevel(level?: number | "random" | string): number[] {
    let targetLevel: number;

    if (level === undefined || level === null || level === "random") {
        targetLevel =
            Math.floor(Math.random() * (MAX_LEVEL - MIN_LEVEL + 1)) + MIN_LEVEL;
    } else {
        const parsed = typeof level === "string" ? parseInt(level, 10) : level;

        if (!Number.isFinite(parsed)) {
            targetLevel =
                Math.floor(Math.random() * (MAX_LEVEL - MIN_LEVEL + 1)) +
                MIN_LEVEL;
        } else {
            const n = Math.round(parsed);
            if (n < MIN_LEVEL) targetLevel = MIN_LEVEL;
            else if (n > MAX_LEVEL) targetLevel = MAX_LEVEL;
            else targetLevel = n;
        }
    }

    // Create array from MIN_LEVEL to targetLevel (inclusive)
    return Array.from(
        { length: targetLevel - MIN_LEVEL + 1 },
        (_, i) => MIN_LEVEL + i
    );
}

/**
 * Resolve a selection input to an array of values from the provided pool.
 * - If `input` is "random" or undefined, returns a random non-empty subset
 *   of `pool`. `opts.min` / `opts.max` control the number of items chosen.
 * - If `input` is an array, returns the unique items filtered to `pool`.
 *
 * Generic so it can be used with SCHOOLS, CLASSES, or any other string pool.
 */
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

        // Fisher-Yates shuffle
        const arr = pool.slice();
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const tmp = arr[i];
            arr[i] = arr[j];
            arr[j] = tmp;
        }
        return arr.slice(0, count);
    }

    // Normalize: unique + filter to pool
    const unique = Array.from(new Set(input));
    return unique.filter((v) => pool.includes(v));
}

// Source: https://github.com/JDSherbert/Fisher-Yates-Shuffle/blob/main/TypeScript/Shuffle.ts
export function FisherYatesShuffle<T>(array: T[]): T[] {
    const shuffledArray = [...array];
    for (let i = shuffledArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledArray[i], shuffledArray[j]] = [
            shuffledArray[j],
            shuffledArray[i],
        ];
    }
    return shuffledArray;
}

export function toTitleCase(s: string): string {
    return s
        .trim()
        .toLowerCase()
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
}
