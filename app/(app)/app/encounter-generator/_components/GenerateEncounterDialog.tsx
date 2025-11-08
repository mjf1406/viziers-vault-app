/** @format */

"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { NumberInputWithStepper } from "@/components/ui/NumberInputWithStepper";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, Sigma } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUser } from "@/hooks/useUser";
import EncounterNameField from "./EncounterNameField";
import EncounterTypeRadio from "@/components/encounters/EncounterTypeRadio";
import DifficultyLevelRadio, {
    type DifficultyLevel,
} from "@/components/encounters/DifficultyLevelRadio";
import TravelMediumRadio from "@/components/encounters/TravelMediumRadio";
import SeasonRadio from "@/components/encounters/SeasonRadio";
import {
    BIOMES,
    type Biome,
    type TravelMedium,
    type Season,
    type EncounterType,
} from "@/lib/constants/encounters";
import generateEncounter from "../_actions/generateEncounter";
import type { GenerateEncounterOpts } from "./RollEncounterDialog";

type GenerateEncounterDialogProps = {
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    onClose?: () => void;
    hideTitleOnMobile?: boolean;
    onGenerate?: (opts: GenerateEncounterOpts) => Promise<void> | void;
};

export default function GenerateEncounterDialog({
    open,
    defaultOpen,
    onOpenChange,
    onClose,
    hideTitleOnMobile = false,
    onGenerate,
}: GenerateEncounterDialogProps) {
    const { user } = useUser();
    const [openLocal, setOpenLocal] = useState<boolean>(!!defaultOpen);
    const isControlled = typeof open !== "undefined";
    const dialogOpen = isControlled ? open : openLocal;
    const setDialogOpen = (v: boolean) => {
        if (!isControlled) setOpenLocal(v);
        onOpenChange?.(v);
        if (!isControlled && !v) onClose?.();
    };
    const [errors, setErrors] = useState<Record<string, string>>({});
    const clearFieldError = (key: string) =>
        setErrors((prev) => {
            const { [key]: _discard, ...rest } = prev;
            return rest;
        });

    const [name, setName] = useState<string>("");
    const [encounterType, setEncounterType] = useState<EncounterType | null>(
        null
    );
    const [quantity, setQuantity] = useState<number>(1);
    const [difficultyLevel, setDifficultyLevel] =
        useState<DifficultyLevel | null>(null);
    const [biome, setBiome] = useState<Biome | null>(null);
    const [travelMedium, setTravelMedium] = useState<TravelMedium | null>(null);
    const [season, setSeason] = useState<Season | null>(null);

    const [isGenerating, setIsGenerating] = useState<boolean>(false);

    const submit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        setIsGenerating(true);

        try {
            const opts: GenerateEncounterOpts = {
                name: name.trim() || undefined,
                biome: biome,
                travelMedium: travelMedium ?? undefined,
                season: season ?? undefined,
                quantity: quantity,
                encounterType: encounterType ?? undefined,
                difficultyLevel: difficultyLevel ?? undefined,
            };

            if (onGenerate) {
                await onGenerate(opts);
            } else {
                const result = await generateEncounter(
                    {
                        name: name.trim() || undefined,
                        options: opts,
                    },
                    user?.id ?? null
                );

                if (Array.isArray(result) && result.length > 0) {
                    // Success
                }
            }

            setDialogOpen(false);
            // Reset form
            setName("");
            setEncounterType(null);
            setQuantity(1);
            setDifficultyLevel(null);
            setBiome(null);
            setTravelMedium(null);
            setSeason(null);
        } catch (err: any) {
            console.error("Encounter generation failed", err);
            setErrors({ form: String(err?.message || "Generation failed") });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Dialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
        >
            <DialogContent className="max-w-2xl max-h-[90vh]">
                <form
                    onSubmit={(e) => void submit(e)}
                    className="flex flex-col"
                >
                    <DialogHeader>
                        <DialogTitle>Generate Encounter</DialogTitle>
                        <DialogDescription>
                            Generate specific encounters by selecting encounter
                            type, difficulty, biome, and other parameters.
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="max-h-[60vh] pr-4">
                        <div className="space-y-6 py-4">
                            {/* Name Field */}
                            <div className="space-y-2">
                                <EncounterNameField
                                    value={name}
                                    onChange={(v) => {
                                        setName(v);
                                        clearFieldError("name");
                                    }}
                                    id="name"
                                    nameAttr="name"
                                    placeholder="e.g., Perilous Encounter"
                                    biome={biome}
                                    travelMedium={travelMedium}
                                    season={season}
                                    hideAutoUpdate={true}
                                />
                                {errors.name ? (
                                    <p className="text-sm text-red-600">
                                        {errors.name}
                                    </p>
                                ) : null}
                            </div>

                            {/* Quantity */}
                            <div className="space-y-2">
                                <Label htmlFor="quantity">Quantity</Label>
                                <NumberInputWithStepper
                                    value={quantity}
                                    onChange={(val) => {
                                        const newVal = val ?? 1;
                                        if (newVal > 0) {
                                            setQuantity(newVal);
                                            clearFieldError("quantity");
                                        }
                                    }}
                                    min={1}
                                    step={1}
                                />
                                {errors.quantity ? (
                                    <p className="text-sm text-red-600">
                                        {errors.quantity}
                                    </p>
                                ) : null}
                            </div>

                            {/* Encounter Type */}
                            <div className="space-y-2">
                                <Label>Encounter Type</Label>
                                <EncounterTypeRadio
                                    value={encounterType ?? undefined}
                                    onChange={(v) => {
                                        setEncounterType(v);
                                        clearFieldError("encounterType");
                                    }}
                                />
                                {errors.encounterType ? (
                                    <p className="text-sm text-red-600">
                                        {errors.encounterType}
                                    </p>
                                ) : null}
                            </div>

                            {/* Difficulty Level */}
                            {encounterType === "combat" && (
                                <div className="space-y-2">
                                    <Label>Difficulty Level</Label>
                                    <DifficultyLevelRadio
                                        value={difficultyLevel ?? undefined}
                                        onChange={(v) => {
                                            setDifficultyLevel(v);
                                            clearFieldError("difficultyLevel");
                                        }}
                                    />
                                    {errors.difficultyLevel ? (
                                        <p className="text-sm text-red-600">
                                            {errors.difficultyLevel}
                                        </p>
                                    ) : null}
                                </div>
                            )}

                            {/* Biome */}
                            <div className="space-y-2">
                                <Label htmlFor="biome">Biome</Label>
                                <Select
                                    value={biome ?? undefined}
                                    onValueChange={(v) => {
                                        setBiome(v as Biome);
                                        clearFieldError("biome");
                                    }}
                                >
                                    <SelectTrigger
                                        id="biome"
                                        className="w-full"
                                    >
                                        <SelectValue placeholder="Select a biome" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {BIOMES.map((b) => (
                                            <SelectItem
                                                key={b}
                                                value={b}
                                            >
                                                {b}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.biome ? (
                                    <p className="text-sm text-red-600">
                                        {errors.biome}
                                    </p>
                                ) : null}
                            </div>

                            {/* Travel Medium */}
                            <div className="space-y-2">
                                <Label>Travel Medium</Label>
                                <TravelMediumRadio
                                    value={travelMedium ?? undefined}
                                    onChange={(v) => {
                                        if (v !== "random") {
                                            setTravelMedium(v);
                                            clearFieldError("travelMedium");
                                        }
                                    }}
                                    includeRandom={false}
                                />
                                {errors.travelMedium ? (
                                    <p className="text-sm text-red-600">
                                        {errors.travelMedium}
                                    </p>
                                ) : null}
                            </div>

                            {/* Season */}
                            <div className="space-y-2">
                                <Label>Season</Label>
                                <SeasonRadio
                                    value={season ?? undefined}
                                    onChange={(v) => {
                                        if (v !== "random") {
                                            setSeason(v);
                                            clearFieldError("season");
                                        }
                                    }}
                                    includeRandom={false}
                                />
                                {errors.season ? (
                                    <p className="text-sm text-red-600">
                                        {errors.season}
                                    </p>
                                ) : null}
                            </div>

                            {errors.form ? (
                                <div className="text-sm text-red-600">
                                    {errors.form}
                                </div>
                            ) : null}
                        </div>
                    </ScrollArea>

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button
                                type="button"
                                variant="outline"
                            >
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button
                            type="submit"
                            disabled={isGenerating}
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Sigma className="h-4 w-4" />
                                    Generate Encounter
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
