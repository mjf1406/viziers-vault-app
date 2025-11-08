/** @format */

"use client";

import React from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export const DIFFICULTY_LEVELS = [
    "trivial",
    "easy",
    "medium",
    "hard",
    "deadly",
] as const;

export type DifficultyLevel = (typeof DIFFICULTY_LEVELS)[number];

const LABELS: Record<DifficultyLevel, string> = {
    trivial: "Trivial",
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
    deadly: "Deadly",
};

export default function DifficultyLevelRadio({
    value,
    onChange,
}: {
    value?: DifficultyLevel | undefined | null;
    onChange: (v: DifficultyLevel) => void;
}) {
    return (
        <RadioGroup
            className="flex gap-2 flex-wrap"
            value={value ?? undefined}
            onValueChange={(v) => onChange(v as DifficultyLevel)}
        >
            {DIFFICULTY_LEVELS.map((opt) => {
                return (
                    <div key={opt} className="flex items-center space-x-2">
                        <RadioGroupItem value={opt} id={opt} />
                        <Label
                            htmlFor={opt}
                            className="cursor-pointer font-normal capitalize"
                        >
                            {LABELS[opt]}
                        </Label>
                    </div>
                );
            })}
        </RadioGroup>
    );
}

