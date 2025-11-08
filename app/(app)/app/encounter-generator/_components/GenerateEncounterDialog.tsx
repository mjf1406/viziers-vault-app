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
import { Loader2, Plus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUser } from "@/hooks/useUser";
import db from "@/lib/db";
import EncounterNameField from "./EncounterNameField";
import EncounterTypeRadio from "@/components/encounters/EncounterTypeRadio";
import DifficultyLevelRadio, {
    type DifficultyLevel,
} from "@/components/encounters/DifficultyLevelRadio";
import TravelMediumRadio from "@/components/encounters/TravelMediumRadio";
import SeasonRadio from "@/components/encounters/SeasonRadio";
import {
    DND_HABITATS,
    TRAVEL_MEDIUMS,
    SEASONS,
    ENCOUNTER_TYPES,
    mapHabitatToBiome,
    type Biome,
    type TravelMedium,
    type Season,
    type EncounterType,
    type DndHabitat,
} from "@/app/(app)/app/encounter-generator/_constants/encounters";
import generateEncounter from "../_actions/generateEncounter";
import type { GenerateEncounterOpts } from "./RollEncounterDialog";
import PartySelector, { type PartyData } from "./PartySelector";
import { z } from "zod";

// Zod schema for validation - takes habitat as a parameter
const createGenerateEncounterFormSchema = (habitat: DndHabitat | null) =>
    z
        .object({
            name: z.string().optional(),
            encounterType: z
                .enum([...ENCOUNTER_TYPES] as [EncounterType, ...EncounterType[]])
                .nullable()
                .optional(),
            quantity: z.number().int().min(1, "Quantity must be at least 1"),
            difficultyLevel: z
                .enum(["trivial", "easy", "medium", "hard", "deadly", "absurd"])
                .nullable()
                .optional(),
            habitat: z
                .enum([...DND_HABITATS] as [DndHabitat, ...DndHabitat[]])
                .nullable()
                .optional(),
            travelMedium: z
                .enum([...TRAVEL_MEDIUMS] as [TravelMedium, ...TravelMedium[]])
                .nullable()
                .optional(),
            season: z
                .enum([...SEASONS] as [Season, ...Season[]])
                .nullable()
                .optional(),
            party: z
                .object({
                    pcs: z.array(
                        z.object({
                            level: z.number().int().min(1).max(20),
                            quantity: z.number().int().min(1),
                        })
                    ),
                })
                .nullable()
                .optional(),
            partyTab: z.enum(["select", "manual"]).optional(), // Track which tab is active
        })
        .refine(
            (data) => {
                // Encounter type is required
                if (!data.encounterType) {
                    return false;
                }
                return true;
            },
            {
                message: "Please select an encounter type",
                path: ["encounterType"],
            }
        )
        .refine(
            (data) => {
                // If encounterType is combat, difficultyLevel should be required
                if (data.encounterType === "combat" && !data.difficultyLevel) {
                    return false;
                }
                return true;
            },
            {
                message: "Difficulty level is required for combat encounters",
                path: ["difficultyLevel"],
            }
        )
        .refine(
            (data) => {
                // If on select party tab, party must be selected
                if (data.partyTab === "select" && !data.party) {
                    return false;
                }
                return true;
            },
            {
                message: "Please select a party",
                path: ["party"],
            }
        )
        .refine(
            (data) => {
                // If on manual tab, party data must be provided
                if (
                    data.partyTab === "manual" &&
                    (!data.party ||
                        !data.party.pcs ||
                        data.party.pcs.length === 0)
                ) {
                    return false;
                }
                return true;
            },
            {
                message: "Please enter party data",
                path: ["party"],
            }
        )
        .refine(
            (data) => {
                // Habitat is required
                if (!data.habitat) {
                    return false;
                }
                return true;
            },
            {
                message: "Please select a biome",
                path: ["habitat"],
            }
        )
        .refine(
            (data) => {
                // Travel medium is required
                if (!data.travelMedium) {
                    return false;
                }
                return true;
            },
            {
                message: "Please select a travel medium",
                path: ["travelMedium"],
            }
        )
        .refine(
            (data) => {
                // Season is required
                if (!data.season) {
                    return false;
                }
                return true;
            },
            {
                message: "Please select a season",
                path: ["season"],
            }
        );

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
    // Fetch settings and monsters data
    const { data: settingsData } = db.useQuery({ settings: {} });
    const { data: monstersData } = db.useQuery({ dnd5e_bestiary: {} });
    const settings = (settingsData as any)?.settings?.[0];
    const allMonsters = ((monstersData as any)?.dnd5e_bestiary ?? []) as any[];
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
    const [habitat, setHabitat] = useState<DndHabitat | null>(null);
    const [travelMedium, setTravelMedium] = useState<TravelMedium | null>(null);
    const [season, setSeason] = useState<Season | null>("summer");
    const [party, setParty] = useState<PartyData>(null);
    const [partyTab, setPartyTab] = useState<"select" | "manual">("select");

    const [isGenerating, setIsGenerating] = useState<boolean>(false);

    const submit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Validate form with Zod
        const formData = {
            name: name.trim() || undefined,
            encounterType: encounterType,
            quantity: quantity,
            difficultyLevel: difficultyLevel,
            habitat: habitat,
            travelMedium: travelMedium,
            season: season,
            party: party,
            partyTab: partyTab,
        };

        const validationResult =
            createGenerateEncounterFormSchema(habitat).safeParse(formData);

        if (!validationResult.success) {
            const fieldErrors: Record<string, string> = {};
            // Zod uses 'issues' not 'errors'
            validationResult.error.issues.forEach((err) => {
                const path = err.path.join(".");
                // If there's already an error for this path, append it
                if (fieldErrors[path]) {
                    fieldErrors[path] += `; ${err.message}`;
                } else {
                    fieldErrors[path] = err.message;
                }
            });
            setErrors(fieldErrors);
            // Scroll to first error
            setTimeout(() => {
                const firstErrorField =
                    document.querySelector("[data-error-field]");
                if (firstErrorField) {
                    firstErrorField.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                    });
                }
            }, 100);
            return;
        }

        // Clear errors on successful validation
        setErrors({});
        setIsGenerating(true);

        try {
            const biome = mapHabitatToBiome(habitat);
            const opts: GenerateEncounterOpts = {
                name: name.trim() || undefined,
                biome: biome,
                travelMedium: travelMedium ?? undefined,
                season: season ?? undefined,
                quantity: quantity,
                encounterType: encounterType ?? undefined,
                difficultyLevel: difficultyLevel ?? undefined,
                party: party,
            };

            if (onGenerate) {
                await onGenerate(opts);
            } else {
                const result = await generateEncounter(
                    {
                        name: name.trim() || undefined,
                        options: opts,
                    },
                    user?.id ?? null,
                    settings,
                    allMonsters
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
            setHabitat(null);
            setTravelMedium(null);
            setSeason("summer");
            setParty(null);
            setPartyTab("select");
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

                    {/* Display form-level errors prominently */}
                    {errors.form && (
                        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-sm font-medium text-red-800">
                                {errors.form}
                            </p>
                        </div>
                    )}

                    <ScrollArea className="max-h-[60vh] pr-4">
                        <div className="space-y-6 py-4">
                            {/* Party Selector */}
                            <div
                                className="space-y-2"
                                data-error-field={
                                    errors.party ? "true" : undefined
                                }
                            >
                                <PartySelector
                                    value={party}
                                    onChange={(p) => {
                                        setParty(p);
                                        clearFieldError("party");
                                    }}
                                    onTabChange={(tab) => {
                                        setPartyTab(tab);
                                        clearFieldError("party");
                                    }}
                                />
                                {errors.party ? (
                                    <p className="text-sm text-red-600 font-medium">
                                        {errors.party}
                                    </p>
                                ) : null}
                            </div>
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
                                    biome={mapHabitatToBiome(habitat)}
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
                            <div
                                className="space-y-2"
                                data-error-field={
                                    errors.encounterType ? "true" : undefined
                                }
                            >
                                <Label>
                                    Encounter Type{" "}
                                    <span className="text-red-600">*</span>
                                </Label>
                                <EncounterTypeRadio
                                    value={encounterType ?? undefined}
                                    onChange={(v) => {
                                        setEncounterType(v);
                                        clearFieldError("encounterType");
                                    }}
                                />
                                {errors.encounterType ? (
                                    <p className="text-sm text-red-600 font-medium">
                                        {errors.encounterType}
                                    </p>
                                ) : null}
                            </div>

                            {/* Difficulty Level */}
                            {encounterType === "combat" && (
                                <div
                                    className="space-y-2"
                                    data-error-field={
                                        errors.difficultyLevel
                                            ? "true"
                                            : undefined
                                    }
                                >
                                    <Label>
                                        Difficulty Level{" "}
                                        <span className="text-red-600">*</span>
                                    </Label>
                                    <DifficultyLevelRadio
                                        value={difficultyLevel ?? undefined}
                                        onChange={(v) => {
                                            setDifficultyLevel(v);
                                            clearFieldError("difficultyLevel");
                                        }}
                                    />
                                    {errors.difficultyLevel ? (
                                        <p className="text-sm text-red-600 font-medium">
                                            {errors.difficultyLevel}
                                        </p>
                                    ) : null}
                                </div>
                            )}
                            {/* Show difficulty level error even when field is hidden */}
                            {errors.difficultyLevel &&
                                encounterType !== "combat" && (
                                    <div className="space-y-2">
                                        <p className="text-sm text-red-600 font-medium">
                                            {errors.difficultyLevel}
                                        </p>
                                    </div>
                                )}

                            {/* Biome */}
                            <div
                                className="space-y-2"
                                data-error-field={
                                    errors.habitat ? "true" : undefined
                                }
                            >
                                <Label htmlFor="biome">
                                    Biome{" "}
                                    <span className="text-red-600">*</span>
                                </Label>
                                <Select
                                    value={habitat ?? undefined}
                                    onValueChange={(v) => {
                                        setHabitat(v as DndHabitat);
                                        clearFieldError("habitat");
                                    }}
                                >
                                    <SelectTrigger
                                        id="biome"
                                        className="w-full"
                                    >
                                        <SelectValue placeholder="Select a biome" />
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
                                {errors.habitat ? (
                                    <p className="text-sm text-red-600 font-medium">
                                        {errors.habitat}
                                    </p>
                                ) : null}
                            </div>

                            {/* Travel Medium */}
                            <div
                                className="space-y-2"
                                data-error-field={
                                    errors.travelMedium ? "true" : undefined
                                }
                            >
                                <Label>
                                    Travel Medium{" "}
                                    <span className="text-red-600">*</span>
                                </Label>
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
                                    <p className="text-sm text-red-600 font-medium">
                                        {errors.travelMedium}
                                    </p>
                                ) : null}
                            </div>

                            {/* Season */}
                            <div
                                className="space-y-2"
                                data-error-field={
                                    errors.season ? "true" : undefined
                                }
                            >
                                <Label>
                                    Season{" "}
                                    <span className="text-red-600">*</span>
                                </Label>
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
                                    <p className="text-sm text-red-600 font-medium">
                                        {errors.season}
                                    </p>
                                ) : null}
                            </div>
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
                                    <Plus className="h-4 w-4" />
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
