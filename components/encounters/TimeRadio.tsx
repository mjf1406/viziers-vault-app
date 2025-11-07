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
import { FaSun, FaMoon } from "react-icons/fa";
import { TIMES, type Time } from "@/lib/constants/encounters";

const ICONS: Record<Time, React.ReactNode> = {
    day: <FaSun />,
    night: <FaMoon />,
};

const LABELS: Record<Time, string> = {
    day: "Day",
    night: "Night",
};

export default function TimeRadio({
    value,
    onChange,
    includeRandom = false,
}: {
    value?: (Time | "random") | undefined | null;
    onChange: (v: Time | "random") => void;
    includeRandom?: boolean;
}) {
    return (
        <RadioGroup
            className="flex gap-1"
            value={value ?? undefined}
            onValueChange={(v) => onChange(v as Time | "random")}
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
            {TIMES.map((opt) => {
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


