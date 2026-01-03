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
import { FaShoePrints, FaShip, FaPlane } from "react-icons/fa";
import { TRAVEL_MEDIUMS, type TravelMedium } from "@/app/(app)/app/encounter-generator/_constants/encounters";

const ICONS: Record<TravelMedium, React.ReactNode> = {
    ground: <FaShoePrints />,
    air: <FaPlane />,
    sea: <FaShip />,
};

const LABELS: Record<TravelMedium, string> = {
    ground: "Ground",
    air: "Air",
    sea: "Sea",
};

export default function TravelMediumRadio({
    value,
    onChange,
    includeRandom = false,
}: {
    value?: (TravelMedium | "random") | undefined | null;
    onChange: (v: TravelMedium | "random") => void;
    includeRandom?: boolean;
}) {
    return (
        <RadioGroup
            className="flex gap-1"
            value={value ?? undefined}
            onValueChange={(v) => onChange(v as TravelMedium | "random")}
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
            {TRAVEL_MEDIUMS.map((opt) => {
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

