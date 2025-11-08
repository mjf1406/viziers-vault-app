/** @format */

"use client";

import React from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Swords, Handshake, OctagonAlert } from "lucide-react";
import {
    ENCOUNTER_TYPES,
    type EncounterType,
} from "@/app/(app)/app/encounter-generator/_constants/encounters";

const ICONS: Record<EncounterType, React.ReactNode> = {
    combat: <Swords className="size-4" />,
    "non-combat": <Handshake className="size-4" />,
    hazard: <OctagonAlert className="size-4" />,
};

const LABELS: Record<EncounterType, string> = {
    combat: "Combat",
    "non-combat": "Non-Combat",
    hazard: "Hazard",
};

export default function EncounterTypeRadio({
    value,
    onChange,
}: {
    value?: EncounterType | undefined | null;
    onChange: (v: EncounterType) => void;
}) {
    return (
        <RadioGroup
            className="flex gap-1"
            value={value ?? undefined}
            onValueChange={(v) => onChange(v as EncounterType)}
        >
            {ENCOUNTER_TYPES.map((opt) => {
                const selected = value === opt;
                const isDisabled = opt === "hazard";
                return (
                    <Tooltip key={opt}>
                        <TooltipTrigger asChild>
                            <label
                                className={
                                    "h-8 min-w-8 px-2 inline-flex items-center justify-center rounded-md border text-xs " +
                                    (isDisabled
                                        ? "opacity-50 cursor-not-allowed bg-muted"
                                        : "cursor-pointer") +
                                    (selected && !isDisabled
                                        ? " bg-primary text-primary-foreground border-primary"
                                        : !isDisabled
                                          ? " bg-background"
                                          : "")
                                }
                            >
                                <RadioGroupItem
                                    value={opt}
                                    className="sr-only"
                                    disabled={isDisabled}
                                />
                                {ICONS[opt]}
                            </label>
                        </TooltipTrigger>
                        <TooltipContent className="capitalize">
                            {isDisabled
                                ? `${LABELS[opt]} - Coming Soon`
                                : LABELS[opt]}
                        </TooltipContent>
                    </Tooltip>
                );
            })}
        </RadioGroup>
    );
}
