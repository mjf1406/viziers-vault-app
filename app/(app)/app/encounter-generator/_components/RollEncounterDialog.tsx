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
import EncounterNameField from "./EncounterNameField";
import EncounterInstance, {
    type EncounterInstanceData,
} from "./EncounterInstance";
import EncounterProbabilityDisplay from "./EncounterProbabilityDisplay";
import {
    BIOMES,
    type Biome,
    type TravelPace,
    type Road,
    type TravelMedium,
    type Time,
    type Season,
} from "@/lib/constants/encounters";
import generateEncounter from "../_actions/generateEncounter";
import { id } from "@instantdb/react";

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
    difficultyLevel?: "trivial" | "easy" | "medium" | "hard" | "deadly" | null;
};

type EncounterInitial = {
    id?: string;
    name?: string;
    biome?: Biome | null;
    travelPace?: TravelPace | "random" | null;
    road?: Road | "random" | null;
    travelMedium?: TravelMedium | "random" | null;
    time?: Time | "random" | null;
    season?: Season | "random" | null;
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

    // Initialize with one instance
    const createDefaultInstance = (): EncounterInstanceData => ({
        id: id(),
        biome: (initial?.biome as Biome) ?? null,
        travelPace: (initial?.travelPace as TravelPace | "random") ?? "random",
        road: (initial?.road as Road | "random") ?? "random",
        travelMedium:
            (initial?.travelMedium as TravelMedium | "random") ?? "random",
        time: (initial?.time as Time | "random") ?? "random",
        season: (initial?.season as Season | "random") ?? "random",
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
                travelPace: "random",
                road: "random",
                travelMedium: "random",
                time: "random",
                season: "random",
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

    // Calculate aggregated probabilities from all instances
    const probabilityData = useMemo(() => {
        // Placeholder: This will be replaced with actual probability calculation
        // that aggregates probabilities from all instances
        // For now, return placeholder data
        return {
            cumulative: [
                { count: 0, probability: 0.3 },
                { count: 1, probability: 0.5 },
                { count: 2, probability: 0.15 },
                { count: 3, probability: 0.05 },
            ],
            byType: {
                combat: [
                    { count: 0, probability: 0.4 },
                    { count: 1, probability: 0.4 },
                    { count: 2, probability: 0.15 },
                    { count: 3, probability: 0.05 },
                ],
                "non-combat": [
                    { count: 0, probability: 0.5 },
                    { count: 1, probability: 0.35 },
                    { count: 2, probability: 0.1 },
                    { count: 3, probability: 0.05 },
                ],
                hazard: [
                    { count: 0, probability: 0.6 },
                    { count: 1, probability: 0.3 },
                    { count: 2, probability: 0.08 },
                    { count: 3, probability: 0.02 },
                ],
            },
        };
    }, [instances]);

    const submit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (mode === "edit") {
            // Edit mode: only update the name and exit early
            // TODO: Implement edit functionality
            setDialogOpen(false);
            return;
        }

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
                        quantity: 1,
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
                        quantity: 1,
                    })
                );

                const result = await generateEncounter(
                    {
                        name: name.trim() || undefined,
                        options: optsArray,
                    },
                    user?.id ?? null
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
                                        time={
                                            instances[0]?.time &&
                                            instances[0].time !== "random"
                                                ? instances[0].time
                                                : null
                                        }
                                        season={
                                            instances[0]?.season &&
                                            instances[0].season !== "random"
                                                ? instances[0].season
                                                : null
                                        }
                                        travelPace={
                                            instances[0]?.travelPace &&
                                            instances[0].travelPace !== "random"
                                                ? instances[0].travelPace
                                                : null
                                        }
                                        road={
                                            instances[0]?.road &&
                                            instances[0].road !== "random"
                                                ? instances[0].road
                                                : null
                                        }
                                        travelMedium={
                                            instances[0]?.travelMedium &&
                                            instances[0].travelMedium !==
                                                "random"
                                                ? instances[0].travelMedium
                                                : null
                                        }
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
                            </div>

                            <ScrollArea className="flex-1 overflow-hidden min-h-0">
                                <div className="p-4 space-y-4">
                                    {instances.map((instance, index) => (
                                        <EncounterInstance
                                            key={instance.id}
                                            instance={instance}
                                            index={index}
                                            onChange={updateInstance}
                                            onDelete={() =>
                                                removeInstance(instance.id)
                                            }
                                            canDelete={instances.length > 1}
                                        />
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
