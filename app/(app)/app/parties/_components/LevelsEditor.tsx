/** @format */

"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { NumberInputWithStepper } from "@/components/ui/NumberInputWithStepper";

export default function LevelsEditor({
    levels,
    updateLevel,
    removeLevel,
}: {
    levels: { level: number; quantity: number }[];
    updateLevel: (
        i: number,
        field: "level" | "quantity",
        value: number
    ) => void;
    removeLevel: (i: number) => void;
}) {
    return (
        <div className="space-y-2 overflow-y-auto max-h-48">
            {levels.map((levelData, idx) => (
                <div
                    key={idx}
                    className="flex items-center gap-2 p-2 border rounded"
                >
                    <div className="flex-1">
                        <Label className="text-xs">Level</Label>
                        <div className="mt-1">
                            <NumberInputWithStepper
                                value={levelData.level}
                                min={1}
                                max={20}
                                step={1}
                                onChange={(newVal) =>
                                    updateLevel(
                                        idx,
                                        "level",
                                        newVal ?? 1
                                    )
                                }
                            />
                        </div>
                    </div>
                    <div className="flex-1">
                        <Label className="text-xs">Quantity</Label>
                        <div className="mt-1">
                            <NumberInputWithStepper
                                value={levelData.quantity}
                                min={1}
                                step={1}
                                onChange={(newVal) =>
                                    updateLevel(
                                        idx,
                                        "quantity",
                                        newVal ?? 1
                                    )
                                }
                            />
                        </div>
                    </div>
                    <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeLevel(idx)}
                        className="mt-5"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            ))}
        </div>
    );
}
