/** @format */

"use client";

import React from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { FaDice, FaPersonCane } from "react-icons/fa6";
import { FaRunning } from "react-icons/fa";
import { GiTurtle } from "react-icons/gi";
import { TRAVEL_PACES, type TravelPace } from "@/app/(app)/app/encounter-generator/_constants/encounters";

const ICONS: Record<TravelPace, React.ReactNode> = {
    slow: <FaPersonCane />,
    normal: <GiTurtle />,
    fast: <FaRunning />,
};

const LABELS: Record<TravelPace, string> = {
    slow: "Slow",
    normal: "Normal",
    fast: "Fast",
};

export default function TravelPaceRadio({
    value,
    onChange,
    includeRandom = false,
}: {
    value?: (TravelPace | "random") | undefined | null;
    onChange: (v: TravelPace | "random") => void;
    includeRandom?: boolean;
}) {
    return (
        <RadioGroup
            className="flex gap-1"
            value={value ?? undefined}
            onValueChange={(v) => onChange(v as TravelPace | "random")}
        >
            {includeRandom ? (
                <Tooltip key="__random__">
                    <TooltipTrigger asChild>
                        <button
                            type="button"
                            onClick={() => onChange("random")}
                            className={
                                "h-8 min-w-8 px-2 inline-flex items-center justify-center rounded-md border text-xs " +
                                (value === "random"
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-background")
                            }
                        >
                            <FaDice />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent>Random</TooltipContent>
                </Tooltip>
            ) : null}
            {TRAVEL_PACES.map((opt) => {
                const selected = value === opt;
                return (
                    <Tooltip key={opt}>
                        <TooltipTrigger asChild>
                            <label
                                className={
                                    "h-8 min-w-8 px-2 inline-flex items-center justify-center rounded-md border text-xs cursor-pointer " +
                                    (selected
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "bg-background")
                                }
                            >
                                <RadioGroupItem
                                    value={opt}
                                    className="sr-only"
                                />
                                {ICONS[opt]}
                            </label>
                        </TooltipTrigger>
                        <TooltipContent className="capitalize">
                            {LABELS[opt]}
                        </TooltipContent>
                    </Tooltip>
                );
            })}
        </RadioGroup>
    );
}

