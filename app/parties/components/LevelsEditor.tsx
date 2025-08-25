/** @format */

"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

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
                        <Input
                            type="number"
                            min={1}
                            max={20}
                            value={levelData.level}
                            onChange={(e) =>
                                updateLevel(
                                    idx,
                                    "level",
                                    parseInt(e.target.value, 10) || 1
                                )
                            }
                            className="mt-1"
                        />
                    </div>
                    <div className="flex-1">
                        <Label className="text-xs">Quantity</Label>
                        <Input
                            type="number"
                            min={1}
                            value={levelData.quantity}
                            onChange={(e) =>
                                updateLevel(
                                    idx,
                                    "quantity",
                                    parseInt(e.target.value, 10) || 1
                                )
                            }
                            className="mt-1"
                        />
                    </div>
                    <Button
                        type="button"
                        variant="outline"
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
