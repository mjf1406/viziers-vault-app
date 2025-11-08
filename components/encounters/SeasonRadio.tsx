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
import { FaSun as FaSunIcon, FaSnowflake } from "react-icons/fa";
import { LuFlower2 } from "react-icons/lu";
import { GiPumpkin } from "react-icons/gi";
import { SEASONS, type Season } from "@/lib/constants/encounters";
import { Leaf } from "lucide-react";

const ICONS: Record<Season, React.ReactNode> = {
    spring: <LuFlower2 />,
    summer: <FaSunIcon />,
    fall: <Leaf className="size-4" />,
    winter: <FaSnowflake />,
};

const LABELS: Record<Season, string> = {
    spring: "Spring",
    summer: "Summer",
    fall: "Fall",
    winter: "Winter",
};

export default function SeasonRadio({
    value,
    onChange,
    includeRandom = false,
}: {
    value?: (Season | "random") | undefined | null;
    onChange: (v: Season | "random") => void;
    includeRandom?: boolean;
}) {
    return (
        <RadioGroup
            className="flex gap-1"
            value={value ?? undefined}
            onValueChange={(v) => onChange(v as Season | "random")}
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
            {SEASONS.map((opt) => {
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
