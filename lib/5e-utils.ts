/** @format */

import { MAX_LEVEL, MIN_LEVEL } from "@/lib/5e-data";

// Resolve a character level (or "random") to an inclusive range [MIN_LEVEL..target]
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

    return Array.from(
        { length: targetLevel - MIN_LEVEL + 1 },
        (_, i) => MIN_LEVEL + i
    );
}

