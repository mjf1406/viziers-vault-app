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
    FaRoad,
    FaMapSigns,
    FaCrown,
    FaHorse,
    FaBan,
} from "react-icons/fa";
import { ROADS, type Road } from "@/app/(app)/app/encounter-generator/_constants/encounters";

const ICONS: Record<Road, React.ReactNode> = {
    "no road": <FaBan />,
    highway: <FaRoad />,
    byway: <FaMapSigns />,
    royalway: <FaCrown />,
    bridleway: <FaHorse />,
};

const LABELS: Record<Road, string> = {
    "no road": "No Road",
    highway: "Highway",
    byway: "Byway",
    royalway: "Royalway",
    bridleway: "Bridleway",
};

export default function RoadRadio({
    value,
    onChange,
    includeRandom = false,
}: {
    value?: (Road | "random") | undefined | null;
    onChange: (v: Road | "random") => void;
    includeRandom?: boolean;
}) {
    return (
        <RadioGroup
            className="flex gap-1"
            value={value ?? undefined}
            onValueChange={(v) => onChange(v as Road | "random")}
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
            {ROADS.map((opt) => {
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

