/** @format */

"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dices, RefreshCw } from "lucide-react";
import type {
    Biome,
    Time,
    Season,
    TravelPace,
    Road,
    TravelMedium,
} from "@/app/(app)/app/encounter-generator/_constants/encounters";

export type EncounterNameFieldProps = {
    value: string;
    onChange: (v: string) => void;
    id?: string;
    nameAttr?: string;
    placeholder?: string;
    label?: string;
    className?: string;
    buttonAriaLabel?: string;
    // For auto-updating name
    biome?: Biome | null;
    time?: Time | null;
    season?: Season | null;
    travelPace?: TravelPace | null;
    road?: Road | null;
    travelMedium?: TravelMedium | null;
    autoUpdate?: boolean;
    onAutoUpdateChange?: (enabled: boolean) => void;
    appendDateTime?: boolean;
    onAppendDateTimeChange?: (enabled: boolean) => void;
    hideAutoUpdate?: boolean;
};

const ENCOUNTER_ADJECTIVES = [
    "Perilous",
    "Mysterious",
    "Forgotten",
    "Ancient",
    "Shadowed",
    "Hidden",
    "Lost",
    "Cursed",
    "Blessed",
    "Wild",
    "Tamed",
    "Sacred",
    "Profane",
    "Eerie",
    "Peaceful",
    "Turbulent",
    "Silent",
    "Echoing",
    "Frozen",
    "Burning",
    "Wet",
    "Dry",
    "Dark",
    "Bright",
    "Gloomy",
    "Sunny",
    "Stormy",
    "Calm",
];

const ENCOUNTER_NOUNS = [
    "Encounter",
    "Meeting",
    "Crossing",
    "Discovery",
    "Event",
    "Incident",
    "Confrontation",
    "Revelation",
    "Moment",
    "Passage",
    "Journey",
    "Path",
    "Trail",
    "Route",
    "Way",
];

function pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function pickTwoDifferent<T>(arr: T[]): [T, T] {
    if (arr.length < 2) return [arr[0], arr[0]];
    const a = pick(arr);
    let b = pick(arr);
    let attempts = 0;
    while (b === a && attempts < 10) {
        b = pick(arr);
        attempts++;
    }
    return [a, b];
}

export function randomEncounterName(): string {
    const roll = Math.random();

    if (roll < 0.4) {
        // Simple: "Perilous Encounter"
        return `${pick(ENCOUNTER_ADJECTIVES)} ${pick(ENCOUNTER_NOUNS)}`;
    }

    if (roll < 0.7) {
        // Two-word: "Mysterious Crossing"
        const [adj, noun] = pickTwoDifferent(ENCOUNTER_ADJECTIVES);
        return `${adj} ${pick(ENCOUNTER_NOUNS)}`;
    }

    // Three-word: "Ancient Perilous Discovery"
    const [adj1, adj2] = pickTwoDifferent(ENCOUNTER_ADJECTIVES);
    return `${adj1} ${adj2} ${pick(ENCOUNTER_NOUNS)}`;
}

function generateAutoName(
    biome?: Biome | null,
    time?: Time | null,
    season?: Season | null,
    travelPace?: TravelPace | null,
    road?: Road | null,
    travelMedium?: TravelMedium | null,
    appendDateTime?: boolean
): string {
    const parts: string[] = [];

    // Biome
    if (biome) {
        const biomeShort = biome.split("/")[0].split("&")[0].trim();
        parts.push(biomeShort);
    }

    // Season
    if (season) {
        parts.push(season);
    }

    // Time
    if (time) {
        parts.push(time);
    }

    // Travel medium
    if (travelMedium) {
        parts.push(travelMedium);
    }

    // Travel pace
    if (travelPace) {
        parts.push(travelPace);
    }

    // Road
    if (road && road !== "no road") {
        parts.push(road);
    }

    if (parts.length === 0) {
        return "Encounter";
    }

    // Capitalize first letter of each part and join
    let name = parts
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(" ");

    // Append datetime if requested
    if (appendDateTime) {
        const dateTimeStr = new Date().toLocaleString();
        name = `${name} - ${dateTimeStr}`;
    }

    return name;
}

export default function EncounterNameField({
    value,
    onChange,
    id = "encounterName",
    nameAttr = "encounterName",
    placeholder = "e.g., Perilous Encounter",
    label = "Name",
    className,
    buttonAriaLabel = "Randomize encounter name",
    biome,
    time,
    season,
    travelPace,
    road,
    travelMedium,
    autoUpdate = false,
    onAutoUpdateChange,
    appendDateTime = false,
    onAppendDateTimeChange,
    hideAutoUpdate = false,
}: EncounterNameFieldProps) {
    // Auto-update name when inputs change
    const prevInputsRef = React.useRef<string>("");
    const isUpdatingRef = React.useRef<boolean>(false);

    React.useEffect(() => {
        if (!autoUpdate) {
            prevInputsRef.current = "";
            isUpdatingRef.current = false;
            return;
        }

        // Prevent infinite loops by checking if we're already updating
        if (isUpdatingRef.current) {
            return;
        }

        const autoName = generateAutoName(
            biome,
            time,
            season,
            travelPace,
            road,
            travelMedium,
            appendDateTime
        );

        // Create a key from all inputs to detect changes
        const inputsKey = JSON.stringify({
            biome,
            time,
            season,
            travelPace,
            road,
            travelMedium,
            appendDateTime,
        });

        // Check if inputs changed or if this is the first run
        const inputsChanged = inputsKey !== prevInputsRef.current;
        const isFirstRun = prevInputsRef.current === "";

        // Only update if inputs changed or if this is the first time auto-update is enabled
        if (inputsChanged || isFirstRun) {
            prevInputsRef.current = inputsKey;

            // Set the flag before updating to prevent re-entry
            isUpdatingRef.current = true;
            onChange(autoName);

            // Reset the flag after React has processed the update
            // Use requestAnimationFrame to ensure it happens after render
            requestAnimationFrame(() => {
                isUpdatingRef.current = false;
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        autoUpdate,
        biome,
        time,
        season,
        travelPace,
        road,
        travelMedium,
        appendDateTime,
        // Note: onChange and value are intentionally omitted to prevent infinite loops
        // The effect will only run when the actual input values change
    ]);

    return (
        <div className={className}>
            <div className="flex items-center justify-between mb-2">
                <Label htmlFor={id}>{label}</Label>
                {!hideAutoUpdate && (
                    <div className="flex items-center gap-3">
                        <Label
                            htmlFor="autoUpdate"
                            className="text-xs font-normal cursor-pointer flex items-center gap-1"
                        >
                            <input
                                type="checkbox"
                                id="autoUpdate"
                                checked={autoUpdate}
                                onChange={(e) =>
                                    onAutoUpdateChange?.(e.target.checked)
                                }
                                className="w-3 h-3"
                            />
                            Auto-update
                        </Label>
                        {autoUpdate && (
                            <Label
                                htmlFor="appendDateTime"
                                className="text-xs font-normal cursor-pointer flex items-center gap-1"
                            >
                                <input
                                    type="checkbox"
                                    id="appendDateTime"
                                    checked={appendDateTime}
                                    onChange={(e) =>
                                        onAppendDateTimeChange?.(
                                            e.target.checked
                                        )
                                    }
                                    className="w-3 h-3"
                                />
                                Append datetime
                            </Label>
                        )}
                    </div>
                )}
            </div>
            <div className="mt-1 flex items-center gap-2">
                <Input
                    id={id}
                    name={nameAttr}
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="flex-1"
                    disabled={autoUpdate}
                />
                <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    aria-label={buttonAriaLabel}
                    title={buttonAriaLabel}
                    onClick={() => onChange(randomEncounterName())}
                    disabled={autoUpdate}
                >
                    <Dices className="h-4 w-4" />
                </Button>
                {autoUpdate && (
                    <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        aria-label="Refresh auto-generated name"
                        title="Refresh auto-generated name"
                        onClick={() =>
                            onChange(
                                generateAutoName(
                                    biome,
                                    time,
                                    season,
                                    travelPace,
                                    road,
                                    travelMedium
                                )
                            )
                        }
                    >
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                )}
            </div>
            {autoUpdate && (
                <p className="text-xs text-muted-foreground mt-1">
                    Name updates automatically based on your selections
                </p>
            )}
        </div>
    );
}
