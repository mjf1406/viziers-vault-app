/** @format */

"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Trash2 } from "lucide-react";
import TravelPaceRadio from "@/components/encounters/TravelPaceRadio";
import RoadRadio from "@/components/encounters/RoadRadio";
import TravelMediumRadio from "@/components/encounters/TravelMediumRadio";
import TimeRadio from "@/components/encounters/TimeRadio";
import SeasonRadio from "@/components/encounters/SeasonRadio";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    BIOMES,
    type Biome,
    type TravelPace,
    type Road,
    type TravelMedium,
    type Time,
    type Season,
} from "@/lib/constants/encounters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type EncounterInstanceData = {
    id: string;
    biome?: Biome | null;
    travelPace?: TravelPace | "random" | null;
    road?: Road | "random" | null;
    travelMedium?: TravelMedium | "random" | null;
    time?: Time | "random" | null;
    season?: Season | "random" | null;
};

type EncounterInstanceProps = {
    instance: EncounterInstanceData;
    index: number;
    onChange: (instance: EncounterInstanceData) => void;
    onDelete: () => void;
    canDelete: boolean;
};

export default function EncounterInstance({
    instance,
    index,
    onChange,
    onDelete,
    canDelete,
}: EncounterInstanceProps) {
    const updateField = <K extends keyof EncounterInstanceData>(
        field: K,
        value: EncounterInstanceData[K]
    ) => {
        onChange({ ...instance, [field]: value });
    };

    return (
        <Card className="w-full">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                        Instance {index + 1}
                    </CardTitle>
                    {canDelete && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={onDelete}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="flex flex-row flex-wrap gap-4">
                <Field className="min-w-[200px] flex-1">
                    <FieldLabel htmlFor={`biome-${instance.id}`}>Biome</FieldLabel>
                    <Select
                        value={instance.biome ?? undefined}
                        onValueChange={(v) => updateField("biome", v as Biome)}
                    >
                        <SelectTrigger id={`biome-${instance.id}`}>
                            <SelectValue placeholder="Select biome" />
                        </SelectTrigger>
                        <SelectContent>
                            {BIOMES.map((b) => (
                                <SelectItem key={b} value={b}>
                                    {b}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </Field>

                <Field className="min-w-[200px] flex-1">
                    <FieldLabel>Travel Pace</FieldLabel>
                    <TravelPaceRadio
                        value={instance.travelPace ?? "random"}
                        onChange={(v) => updateField("travelPace", v as any)}
                        includeRandom
                    />
                </Field>

                <Field className="min-w-[200px] flex-1">
                    <FieldLabel>Road</FieldLabel>
                    <RoadRadio
                        value={instance.road ?? "random"}
                        onChange={(v) => updateField("road", v as any)}
                        includeRandom
                    />
                </Field>

                <Field className="min-w-[200px] flex-1">
                    <FieldLabel>Travel Medium</FieldLabel>
                    <TravelMediumRadio
                        value={instance.travelMedium ?? "random"}
                        onChange={(v) => updateField("travelMedium", v as any)}
                        includeRandom
                    />
                </Field>

                <Field className="min-w-[200px] flex-1">
                    <FieldLabel>Time</FieldLabel>
                    <TimeRadio
                        value={instance.time ?? "random"}
                        onChange={(v) => updateField("time", v as any)}
                        includeRandom
                    />
                </Field>

                <Field className="min-w-[200px] flex-1">
                    <FieldLabel>Season</FieldLabel>
                    <SeasonRadio
                        value={instance.season ?? "random"}
                        onChange={(v) => updateField("season", v as any)}
                        includeRandom
                    />
                </Field>
            </CardContent>
        </Card>
    );
}

