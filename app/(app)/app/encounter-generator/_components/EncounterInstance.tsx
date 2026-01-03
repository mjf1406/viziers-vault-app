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
    DND_HABITATS,
    mapHabitatToBiome,
    mapBiomeToHabitat,
    type Biome,
    type TravelPace,
    type Road,
    type TravelMedium,
    type Time,
    type Season,
    type DndHabitat,
} from "@/app/(app)/app/encounter-generator/_constants/encounters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NumberInputWithStepper } from "@/components/ui/NumberInputWithStepper";

export type EncounterInstanceData = {
    id: string;
    biome?: Biome | null;
    travelPace?: TravelPace | null;
    road?: Road | null;
    travelMedium?: TravelMedium | null;
    time?: Time | null;
    season?: Season | null;
    quantity?: number;
};

type EncounterInstanceProps = {
    instance: EncounterInstanceData;
    index: number;
    onChange: (instance: EncounterInstanceData) => void;
    onDelete: () => void;
    canDelete: boolean;
    onFieldChange?: (fieldName: string) => void;
};

export default function EncounterInstance({
    instance,
    index,
    onChange,
    onDelete,
    canDelete,
    onFieldChange,
}: EncounterInstanceProps) {
    const updateField = <K extends keyof EncounterInstanceData>(
        field: K,
        value: EncounterInstanceData[K]
    ) => {
        onChange({ ...instance, [field]: value });
        // Clear error for this specific field
        onFieldChange?.(field);
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
                    <FieldLabel htmlFor={`biome-${instance.id}`}>
                        Biome <span className="text-red-600">*</span>
                    </FieldLabel>
                    <Select
                        value={mapBiomeToHabitat(instance.biome ?? null) ?? undefined}
                        onValueChange={(v) => {
                            const biome = mapHabitatToBiome(v);
                            updateField("biome", biome);
                        }}
                    >
                        <SelectTrigger id={`biome-${instance.id}`}>
                            <SelectValue placeholder="Select biome" />
                        </SelectTrigger>
                        <SelectContent>
                            {DND_HABITATS.map((h) => (
                                <SelectItem
                                    key={h}
                                    value={h}
                                >
                                    {h}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </Field>

                <Field className="min-w-[200px] flex-1">
                    <FieldLabel>
                        Travel Pace <span className="text-red-600">*</span>
                    </FieldLabel>
                    <TravelPaceRadio
                        value={instance.travelPace ?? undefined}
                        onChange={(v) => {
                            if (v !== "random") {
                                updateField("travelPace", v as any);
                            }
                        }}
                        includeRandom={false}
                    />
                </Field>

                <Field className="min-w-[200px] flex-1">
                    <FieldLabel>
                        Road <span className="text-red-600">*</span>
                    </FieldLabel>
                    <RoadRadio
                        value={instance.road ?? undefined}
                        onChange={(v) => {
                            if (v !== "random") {
                                updateField("road", v as any);
                            }
                        }}
                        includeRandom={false}
                    />
                </Field>

                <Field className="min-w-[200px] flex-1">
                    <FieldLabel>
                        Travel Medium <span className="text-red-600">*</span>
                    </FieldLabel>
                    <TravelMediumRadio
                        value={instance.travelMedium ?? undefined}
                        onChange={(v) => {
                            if (v !== "random") {
                                updateField("travelMedium", v as any);
                            }
                        }}
                        includeRandom={false}
                    />
                </Field>

                <Field className="min-w-[200px] flex-1">
                    <FieldLabel>
                        Time <span className="text-red-600">*</span>
                    </FieldLabel>
                    <TimeRadio
                        value={instance.time ?? undefined}
                        onChange={(v) => {
                            if (v !== "random") {
                                updateField("time", v as any);
                            }
                        }}
                        includeRandom={false}
                    />
                </Field>

                <Field className="min-w-[200px] flex-1">
                    <FieldLabel>
                        Season <span className="text-red-600">*</span>
                    </FieldLabel>
                    <SeasonRadio
                        value={instance.season ?? undefined}
                        onChange={(v) => {
                            if (v !== "random") {
                                updateField("season", v as any);
                            }
                        }}
                        includeRandom={false}
                    />
                </Field>

                <Field className="min-w-[200px] flex-1">
                    <FieldLabel>
                        Quantity <span className="text-red-600">*</span>
                    </FieldLabel>
                    <NumberInputWithStepper
                        value={instance.quantity ?? 1}
                        min={1}
                        step={1}
                        onChange={(val) => updateField("quantity", val ?? 1)}
                    />
                </Field>
            </CardContent>
        </Card>
    );
}
