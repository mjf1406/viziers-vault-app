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
