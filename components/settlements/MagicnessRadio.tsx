/** @format */

"use client";

import React from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { FaDice } from "react-icons/fa6";
import {
    MAGICNESS_LEVELS,
    type MagicnessLevel,
} from "@/lib/constants/settlements";

export default function MagicnessRadio({
    value,
    onChange,
    includeRandom = false,
}: {
    value?: (MagicnessLevel | "random") | undefined | null;
    onChange: (v: MagicnessLevel | "random") => void;
    includeRandom?: boolean;
}) {
    return (
        <RadioGroup
            className="flex gap-1"
            value={value ?? undefined}
            onValueChange={(v) => onChange(v as MagicnessLevel | "random")}
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
            {MAGICNESS_LEVELS.map((opt, idx) => {
                const selected = value === opt;
                const label = String(idx + 1);
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
                                {label}
                            </label>
                        </TooltipTrigger>
                        <TooltipContent className="capitalize">
                            {opt}
                        </TooltipContent>
                    </Tooltip>
                );
            })}
        </RadioGroup>
    );
}
