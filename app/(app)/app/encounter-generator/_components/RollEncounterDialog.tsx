/** @format */

"use client";

import React, { useState, useMemo } from "react";
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
import { Dices, Loader2, Plus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUser } from "@/hooks/useUser";
import db from "@/lib/db";
import EncounterNameField from "./EncounterNameField";
import EncounterInstance, {
    type EncounterInstanceData,
} from "./EncounterInstance";
import EncounterProbabilityDisplay from "./EncounterProbabilityDisplay";
import {
    BIOMES,
    TRAVEL_PACES,
    ROADS,
    TRAVEL_MEDIUMS,
    TIMES,
    SEASONS,
    type Biome,
    type TravelPace,
    type Road,
    type TravelMedium,
    type Time,
    type Season,
} from "@/app/(app)/app/encounter-generator/_constants/encounters";
import generateEncounter from "../_actions/generateEncounter";
import { id } from "@instantdb/react";
import PartySelector, { type PartyData } from "./PartySelector";
import { z } from "zod";
import { calculateEncounterProbabilityDistribution } from "@/app/(app)/app/encounter-generator/_utils/encounter-probabilities";

// Zod schemas for validation
const encounterInstanceSchema = z
    .object({
        id: z.string(),
        biome: z
            .enum([...BIOMES] as [Biome, ...Biome[]])
            .nullable()
            .optional(),
        travelPace: z
            .enum([...TRAVEL_PACES] as [TravelPace, ...TravelPace[]])
            .nullable()
            .optional(),
        road: z
            .enum([...ROADS] as [Road, ...Road[]])
            .nullable()
            .optional(),
        travelMedium: z
            .enum([...TRAVEL_MEDIUMS] as [TravelMedium, ...TravelMedium[]])
            .nullable()
            .optional(),
        time: z
            .enum([...TIMES] as [Time, ...Time[]])
            .nullable()
            .optional(),
        season: z
            .enum([...SEASONS] as [Season, ...Season[]])
            .nullable()
            .optional(),
        quantity: z.number().int().min(1, "Quantity must be at least 1"),
    })
    .refine((data) => data.biome !== null && data.biome !== undefined, {
        message: "Biome is required",
        path: ["biome"],
    })
    .refine(
        (data) => data.travelPace !== null && data.travelPace !== undefined,
        {
            message: "Travel pace is required",
            path: ["travelPace"],
        }
    )
    .refine((data) => data.road !== null && data.road !== undefined, {
        message: "Road is required",
        path: ["road"],
    })
    .refine(
        (data) => data.travelMedium !== null && data.travelMedium !== undefined,
        {
            message: "Travel medium is required",
            path: ["travelMedium"],
        }
    )
    .refine((data) => data.time !== null && data.time !== undefined, {
        message: "Time is required",
        path: ["time"],
    })
    .refine((data) => data.season !== null && data.season !== undefined, {
        message: "Season is required",
        path: ["season"],
    });

const rollEncounterFormSchema = z
    .object({
        name: z.string().optional(),
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
        instances: z
            .array(encounterInstanceSchema)
            .min(1, "At least one instance is required"),
    })
    .refine(
        (data) => data.party !== null && data.party !== undefined,
        {
            message: "Please select or enter party data",
            path: ["party"],
        }
    )
    .refine(
        (data) =>
            data.party && data.party.pcs && data.party.pcs.length > 0,
        {
            message: "Please select or enter party data",
            path: ["party"],
        }
    );

export type GenerateEncounterOpts = {
    name?: string | null;
    biome?: Biome | null;
    travelPace?: TravelPace | "random" | null;
    road?: Road | "random" | null;
    travelMedium?: TravelMedium | "random" | null;
    time?: Time | "random" | null;
    season?: Season | "random" | null;
    climate?: string | null; // TBD
    quantity?: number;
    encounterType?: "combat" | "non-combat" | "hazard" | null;
    difficultyLevel?:
        | "trivial"
        | "easy"
        | "medium"
        | "hard"
        | "deadly"
        | "absurd"
        | null;
    party?: { pcs: Array<{ level: number; quantity: number }> } | null;
};

type EncounterInitial = {
    id?: string;
    name?: string;
    biome?: Biome | null;
    travelPace?: TravelPace | null;
    road?: Road | null;
    travelMedium?: TravelMedium | null;
    time?: Time | null;
    season?: Season | null;
};

type RollEncounterDialogProps = {
    mode?: "create" | "edit";
    initial?: EncounterInitial | null;
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    onClose?: () => void;
    hideTitleOnMobile?: boolean;
    onGenerate?: (opts: GenerateEncounterOpts) => Promise<void> | void;
};

export default function RollEncounterDialog({
    mode = "create",
    initial = null,
    open,
    defaultOpen,
    onOpenChange,
    onClose,
    hideTitleOnMobile = false,
    onGenerate,
}: RollEncounterDialogProps) {
    const { plan, user } = useUser();
    // Fetch settings and monsters data
    const { data: settingsData } = db.useQuery({ settings: {} });
    const { data: monstersData } = db.useQuery({ dnd5e_bestiary: {} });
    const settings = (settingsData as any)?.settings?.[0];
    const allMonsters = ((monstersData as any)?.dnd5e_bestiary ?? []) as any[];
    const isPaid = Boolean(plan && plan.toLowerCase() !== "free");
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

    const [name, setName] = useState<string>(initial?.name ?? "");
    const [autoUpdateName, setAutoUpdateName] = useState<boolean>(false);
    const [appendDateTime, setAppendDateTime] = useState<boolean>(false);
    const [party, setParty] = useState<PartyData>(null);

    // Initialize with one instance
    const createDefaultInstance = (): EncounterInstanceData => ({
        id: id(),
        biome: (initial?.biome as Biome) ?? null,
        travelPace: (initial?.travelPace as TravelPace) ?? "normal",
        road: (initial?.road as Road) ?? null,
        travelMedium: (initial?.travelMedium as TravelMedium) ?? null,
        time: (initial?.time as Time) ?? null,
        season: (initial?.season as Season) ?? "summer",
        quantity: 1,
    });

    const [instances, setInstances] = useState<EncounterInstanceData[]>(() => [
        createDefaultInstance(),
    ]);

    const addInstance = () => {
        setInstances([
            ...instances,
            {
                id: id(),
                biome: null,
                travelPace: "normal",
                road: null,
                travelMedium: null,
                time: null,
                season: "summer",
                quantity: 1,
            },
        ]);
    };

    const removeInstance = (instanceId: string) => {
        if (instances.length > 1) {
            setInstances(instances.filter((i) => i.id !== instanceId));
        }
    };

    const updateInstance = (updatedInstance: EncounterInstanceData) => {
        setInstances(
            instances.map((i) =>
                i.id === updatedInstance.id ? updatedInstance : i
            )
        );
    };

    const handleFieldChange = (instanceId: string, fieldName: string) => {
        const instanceIndex = instances.findIndex(
            (i) => i.id === instanceId
        );
        if (instanceIndex >= 0) {
            // Clear error for this specific field only
            clearFieldError(`instances.${instanceIndex}.${fieldName}`);
            // Also clear general instance error if it exists
            clearFieldError(`instances.${instanceIndex}`);
        }
    };

    // Calculate aggregated probabilities from all instances
    const probabilityData = useMemo(() => {
        if (!instances || instances.length === 0) {
            return {
                cumulative: [{ count: 0, probability: 1 }],
                byType: {
                    combat: [{ count: 0, probability: 1 }],
                    "non-combat": [{ count: 0, probability: 1 }],
                    hazard: [{ count: 0, probability: 1 }],
                },
            };
        }

        return calculateEncounterProbabilityDistribution(
            instances.map((inst) => ({
                biome: inst.biome ?? null,
                time: inst.time ?? null,
                road: inst.road ?? null,
                travelPace: inst.travelPace ?? null,
                quantity: inst.quantity ?? 1,
            })),
            settings
        );
    }, [instances, settings]);

    const submit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (mode === "edit") {
            // Edit mode: only update the name and exit early
            // TODO: Implement edit functionality
            setDialogOpen(false);
            return;
        }

        // Validate form with Zod
        const formData = {
            name: name.trim() || undefined,
            party: party,
            instances: instances,
        };

        const validationResult = rollEncounterFormSchema.safeParse(formData);

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
            // Generate encounters for each instance
            const allResults: string[] = [];

            if (onGenerate) {
                // If custom generate handler, call it for each instance
                for (const instance of instances) {
                    const opts: GenerateEncounterOpts = {
                        name: name.trim() || undefined,
                        biome: instance.biome,
                        travelPace: instance.travelPace,
                        road: instance.road,
                        travelMedium: instance.travelMedium,
                        time: instance.time,
                        season: instance.season,
                        quantity: instance.quantity ?? 1,
                        party: party,
                    };
                    await onGenerate(opts);
                }
            } else {
                // Batch generate all encounters in one call, combining all instances
                const optsArray: GenerateEncounterOpts[] = instances.map(
                    (instance) => ({
                        name: name.trim() || undefined,
                        biome: instance.biome,
                        travelPace: instance.travelPace,
                        road: instance.road,
                        travelMedium: instance.travelMedium,
                        time: instance.time,
                        season: instance.season,
                        quantity: instance.quantity ?? 1,
                        party: party,
                    })
                );

                const result = await generateEncounter(
                    {
                        name: name.trim() || undefined,
                        options: optsArray,
                    },
                    user?.id ?? null,
                    settings,
                    allMonsters
                );

                if (Array.isArray(result) && result.length > 0) {
                    allResults.push(...result);
                }
            }

            if (allResults.length > 0 || onGenerate) {
                setDialogOpen(false);
                // Reset form
                setName("");
                setInstances([createDefaultInstance()]);
                setParty(null);
            }
        } catch (err: any) {
            console.error("Encounter generation failed", err);
            setErrors({ form: String(err?.message || "Generation failed") });
        } finally {
            setIsGenerating(false);
        }
    };

    const [isGenerating, setIsGenerating] = useState<boolean>(false);

    return (
        <Dialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
        >
            <DialogContent className="!max-w-none !w-[100vw] !h-[100vh] !max-h-[100vh] !inset-0 !translate-x-0 !translate-y-0 !rounded-none p-0 flex flex-col">
                <form
                    onSubmit={(e) => void submit(e)}
                    className="flex flex-col h-full"
                >
                    <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
                        <DialogTitle>
                            {mode === "edit"
                                ? "Edit Encounter"
                                : "Roll for Encounters"}
                        </DialogTitle>
                        {mode !== "edit" && (
                            <DialogDescription>
                                Roll for random encounters based on travel
                                conditions. Configure multiple instances with
                                different parameters and see probability
                                distributions before rolling. In this mode, it's
                                possible that no encounter occurs.
                            </DialogDescription>
                        )}
                    </DialogHeader>

                    {/* Display form-level errors prominently */}
                    {errors.form && (
                        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-sm font-medium text-red-800">
                                {errors.form}
                            </p>
                        </div>
                    )}

                    <div className="flex-1 flex overflow-hidden">
                        {/* Left side: Instances (70%) */}
                        <div className="w-[70%] border-r flex flex-col overflow-hidden">
                            <div className="p-4 border-b shrink-0">
                                {mode === "edit" || (isPaid && user?.id) ? (
                                    <EncounterNameField
                                        value={name}
                                        onChange={(v) => {
                                            setName(v);
                                            clearFieldError("form");
                                            clearFieldError("name");
                                        }}
                                        id="name"
                                        nameAttr="name"
                                        placeholder="e.g., Perilous Encounter"
                                        biome={instances[0]?.biome ?? null}
                                        time={instances[0]?.time ?? null}
                                        season={instances[0]?.season ?? null}
                                        travelPace={instances[0]?.travelPace ?? null}
                                        road={instances[0]?.road ?? null}
                                        travelMedium={instances[0]?.travelMedium ?? null}
                                        autoUpdate={autoUpdateName}
                                        onAutoUpdateChange={setAutoUpdateName}
                                        appendDateTime={appendDateTime}
                                        onAppendDateTimeChange={
                                            setAppendDateTime
                                        }
                                    />
                                ) : null}
                                {errors.name ? (
                                    <p className="text-sm text-red-600 mt-1">
                                        {errors.name}
                                    </p>
                                ) : null}
                                {errors.form ? (
                                    <div className="text-sm text-red-600 mt-2">
                                        {errors.form}
                                    </div>
                                ) : null}

                                {/* Party Selector */}
                                <div
                                    className="mt-4 space-y-2"
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
                                    />
                                    {errors.party ? (
                                        <p className="text-sm text-red-600 font-medium">
                                            {errors.party}
                                        </p>
                                    ) : null}
                                </div>
                            </div>

                            <ScrollArea className="flex-1 overflow-hidden min-h-0">
                                <div className="p-4 space-y-4">
                                    {errors.instances && (
                                        <div
                                            className="text-sm text-red-600 p-2 bg-red-50 rounded border border-red-200 font-medium"
                                            data-error-field="true"
                                        >
                                            {errors.instances}
                                        </div>
                                    )}
                                    {instances.map((instance, index) => (
                                        <div
                                            key={instance.id}
                                            data-error-field={
                                                errors[`instances.${index}`] ||
                                                errors[`instances.${index}.biome`] ||
                                                errors[`instances.${index}.travelPace`] ||
                                                errors[`instances.${index}.road`] ||
                                                errors[`instances.${index}.travelMedium`] ||
                                                errors[`instances.${index}.time`] ||
                                                errors[`instances.${index}.season`] ||
                                                errors[`instances.${index}.quantity`]
                                                    ? "true"
                                                    : undefined
                                            }
                                        >
                                            <EncounterInstance
                                                instance={instance}
                                                index={index}
                                                onChange={updateInstance}
                                                onDelete={() =>
                                                    removeInstance(instance.id)
                                                }
                                                canDelete={instances.length > 1}
                                                onFieldChange={(fieldName) =>
                                                    handleFieldChange(instance.id, fieldName)
                                                }
                                            />
                                            {(errors[`instances.${index}`] ||
                                                errors[`instances.${index}.biome`] ||
                                                errors[`instances.${index}.travelPace`] ||
                                                errors[`instances.${index}.road`] ||
                                                errors[`instances.${index}.travelMedium`] ||
                                                errors[`instances.${index}.time`] ||
                                                errors[`instances.${index}.season`] ||
                                                errors[`instances.${index}.quantity`]) && (
                                                <div className="mt-2 space-y-1">
                                                    {errors[`instances.${index}`] && (
                                                        <p className="text-sm text-red-600 font-medium">
                                                            {errors[`instances.${index}`]}
                                                        </p>
                                                    )}
                                                    {errors[`instances.${index}.biome`] && (
                                                        <p className="text-sm text-red-600">
                                                            Biome: {errors[`instances.${index}.biome`]}
                                                        </p>
                                                    )}
                                                    {errors[`instances.${index}.travelPace`] && (
                                                        <p className="text-sm text-red-600">
                                                            Travel Pace: {errors[`instances.${index}.travelPace`]}
                                                        </p>
                                                    )}
                                                    {errors[`instances.${index}.road`] && (
                                                        <p className="text-sm text-red-600">
                                                            Road: {errors[`instances.${index}.road`]}
                                                        </p>
                                                    )}
                                                    {errors[`instances.${index}.travelMedium`] && (
                                                        <p className="text-sm text-red-600">
                                                            Travel Medium: {errors[`instances.${index}.travelMedium`]}
                                                        </p>
                                                    )}
                                                    {errors[`instances.${index}.time`] && (
                                                        <p className="text-sm text-red-600">
                                                            Time: {errors[`instances.${index}.time`]}
                                                        </p>
                                                    )}
                                                    {errors[`instances.${index}.season`] && (
                                                        <p className="text-sm text-red-600">
                                                            Season: {errors[`instances.${index}.season`]}
                                                        </p>
                                                    )}
                                                    {errors[`instances.${index}.quantity`] && (
                                                        <p className="text-sm text-red-600">
                                                            Quantity: {errors[`instances.${index}.quantity`]}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {/* Add Instance button - inside scrollable area */}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={addInstance}
                                        className="w-full"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Instance
                                    </Button>
                                </div>
                            </ScrollArea>
                        </div>

                        {/* Right side: Probabilities (30%) */}
                        <div className="w-[30%] p-4 overflow-y-auto">
                            <EncounterProbabilityDisplay
                                data={probabilityData}
                            />
                        </div>
                    </div>

                    <DialogFooter className="px-6 py-4 border-t shrink-0">
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
                                    <Dices className="h-4 w-4 mr-2" />
                                    Roll for Encounters
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
