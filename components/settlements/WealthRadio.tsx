/** @format */

"use client";

import React from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { WEALTH_LEVELS, type WealthLevel } from "@/lib/constants/settlements";
import { FaDice } from "react-icons/fa6";

export default function WealthRadio({
    value,
    onChange,
    includeRandom = false,
}: {
    value?: (WealthLevel | "random") | undefined | null;
    onChange: (v: WealthLevel | "random") => void;
    includeRandom?: boolean;
}) {
    return (
        <RadioGroup
            className="flex gap-1"
            value={value ?? undefined}
            onValueChange={(v) => onChange(v as WealthLevel | "random")}
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
            {WEALTH_LEVELS.map((opt, idx) => {
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
