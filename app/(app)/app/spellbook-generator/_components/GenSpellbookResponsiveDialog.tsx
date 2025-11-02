/** @format */

"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
// removed toast-based validation in favor of Zod + inline errors
import {
    Credenza,
    CredenzaBody,
    CredenzaClose,
    CredenzaContent,
    CredenzaFooter,
    CredenzaHeader,
    CredenzaTitle,
} from "@/components/ui/credenza";
import { generateSpellbookClient } from "../_actions/generateSpellbookClient";
import { updateSpellbook } from "../_actions/updateSpellbook";
import { CLASSES, SCHOOLS, SOURCE_SHORTS } from "@/lib/5e-data";
import { Dices, Loader2 } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import db from "@/lib/db";
import SpellbookNameField from "./SpellbookNameField";
import {
    buildSpellbookFilename,
    downloadCsv,
    spellsToCsv,
} from "./DownloadSpellbookCSVButton";
import { toTitleCase } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Toggle } from "@/components/ui/toggle";
import { z } from "zod";

export type GenerateOpts = {
    level: number | "random";
    schools: string[] | "random";
    classes: string[] | "random";
};

type SpellbookInitial = {
    id?: string;
    name?: string;
    level?: number | "random";
    schools?: string[] | "random";
    classes?: string[] | "random";
};

type SpellbookGeneratorDialogProps = {
    mode?: "create" | "edit";
    initial?: SpellbookInitial | null;
    addPending?: (id: string) => void;
    removePending?: (id: string) => void;
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    onClose?: () => void;
    hideTitleOnMobile?: boolean;
    onGenerate?: (opts: GenerateOpts) => Promise<void> | void;
};

const getSpellbookSchema = (requireName: boolean) =>
    z
        .object({
            name: requireName
                ? z.string().trim().min(1, "Name is required")
                : z.string().optional(),
            level: z.union([
                z.literal("random"),
                z
                    .string()
                    .regex(
                        /^(?:[1-9]|1\d|20)$/g,
                        "Pick a level 1-20 or Random"
                    ),
            ]),
            schoolsRandom: z.boolean(),
            selectedSchools: z
                .array(z.string())
                .refine(
                    (arr) => arr.every((s) => SCHOOLS.includes(s)),
                    "Invalid school selected"
                ),
            classesRandom: z.boolean(),
            selectedClasses: z
                .array(z.string())
                .refine(
                    (arr) => arr.every((c) => CLASSES.includes(c)),
                    "Invalid class selected"
                ),
            selectedSources: z.array(z.string()).optional(),
            excludeLegacy: z.boolean(),
        })
        .superRefine((val, ctx) => {
            if (!val.schoolsRandom && val.selectedSchools.length === 0) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["selectedSchools"],
                    message: "Select at least one school or choose Random",
                });
            }
            if (!val.classesRandom && val.selectedClasses.length === 0) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["selectedClasses"],
                    message: "Select at least one class or choose Random",
                });
            }
            if (val.level !== "random") {
                const n = parseInt(val.level, 10);
                if (!(n >= 1 && n <= 20)) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        path: ["level"],
                        message: "Level must be between 1 and 20",
                    });
                }
            }
        });

export default function SpellbookGeneratorDialog({
    mode = "create",
    initial = null,
    addPending,
    removePending,
    open,
    defaultOpen,
    onOpenChange,
    onClose,
    hideTitleOnMobile = false,
    onGenerate,
}: SpellbookGeneratorDialogProps) {
    const { user, plan, settings } = useUser();
    const isPaid = Boolean(plan && plan.toLowerCase() !== "free");
    
    // Load all spells for client-side generation
    const { data: spellsData } = db.useQuery({
        dnd5e_spells: {},
    });
    const allSpells = (spellsData?.dnd5e_spells ?? []) as any[];
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

    const [selectedLevel, setSelectedLevel] = useState<string>(
        initial?.level ? String(initial.level) : "random"
    );

    // Schools: default to random per request
    const [schoolsRandom, setSchoolsRandom] = useState<boolean>(
        initial?.schools === "random" ? true : initial?.schools ? false : true
    );
    const [selectedSchools, setSelectedSchools] = useState<string[]>(
        initial?.schools && initial?.schools !== "random"
            ? [...initial.schools]
            : []
    );

    const [classesRandom, setClassesRandom] = useState<boolean>(
        initial?.classes === "random"
    );
    const [selectedClasses, setSelectedClasses] = useState<string[]>(() => {
        if (initial?.classes === "random") return [];
        const raw = Array.isArray(initial?.classes)
            ? (initial!.classes as string[])
            : typeof initial?.classes === "string" && initial?.classes
            ? [initial!.classes as string]
            : ["Wizard"];
        // Normalize casing to match CLASSES values
        const normalized = raw
            .map((c) => toTitleCase(String(c)))
            .filter((c) => CLASSES.includes(c));
        return normalized.length ? normalized : ["Wizard"];
    });

    // store previous selections so toggle Random on/off can restore
    const prevSchoolsRef = useRef<string[] | null>(null);
    const prevClassesRef = useRef<string[] | null>(null);

    useEffect(() => {
        if (initial) {
            setName(initial.name ?? "");
            setSelectedLevel(initial.level ? String(initial.level) : "random");

            if (initial.schools === "random") {
                setSchoolsRandom(true);
                setSelectedSchools([]);
            } else if (Array.isArray(initial.schools)) {
                setSchoolsRandom(false);
                setSelectedSchools([...initial.schools]);
            } else {
                setSchoolsRandom(true);
                setSelectedSchools([]);
            }

            if (initial.classes === "random") {
                setClassesRandom(true);
                setSelectedClasses([]);
            } else if (Array.isArray(initial.classes)) {
                setClassesRandom(false);
                const normalized = initial.classes
                    .map((c) => toTitleCase(String(c)))
                    .filter((c) => CLASSES.includes(c));
                setSelectedClasses(normalized.length ? normalized : ["Wizard"]);
            } else if (typeof initial.classes === "string" && initial.classes) {
                setClassesRandom(false);
                const single = toTitleCase(String(initial.classes));
                setSelectedClasses(
                    CLASSES.includes(single) ? [single] : ["Wizard"]
                );
            } else {
                setClassesRandom(false);
                setSelectedClasses(["Wizard"]);
            }
        } else {
            // defaults when no initial provided
            setName("");
            setSelectedLevel("random");
            setSchoolsRandom(true);
            setSelectedSchools([]);
            setClassesRandom(false);
            setSelectedClasses(["Wizard"]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initial]);

    const [isGenerating, setIsGenerating] = useState(false);
    const [name, setName] = useState<string>(initial?.name ?? "");

    const allSchoolsSelected = selectedSchools.length === SCHOOLS.length;

    // Sources: default to all selected
    const [selectedSources, setSelectedSources] = useState<string[]>([
        ...SOURCE_SHORTS,
    ]);
    const allSourcesSelected = selectedSources.length === SOURCE_SHORTS.length;

    // Exclude Legacy (default on)
    const [excludeLegacy, setExcludeLegacy] = useState<boolean>(true);

    const toggleSchoolsRandom = (value: boolean) => {
        if (value) {
            prevSchoolsRef.current = selectedSchools;
            setSelectedSchools([]);
            setSchoolsRandom(true);
        } else {
            const restored =
                prevSchoolsRef.current && prevSchoolsRef.current.length
                    ? prevSchoolsRef.current
                    : [...SCHOOLS];
            prevSchoolsRef.current = null;
            setSelectedSchools(restored);
            setSchoolsRandom(false);
        }
        clearFieldError("selectedSchools");
    };

    const toggleClassesRandom = (value: boolean) => {
        if (value) {
            prevClassesRef.current = selectedClasses;
            setSelectedClasses([]);
            setClassesRandom(true);
        } else {
            const restored =
                prevClassesRef.current && prevClassesRef.current.length
                    ? prevClassesRef.current
                    : ["Wizard"];
            prevClassesRef.current = null;
            setSelectedClasses(restored);
            setClassesRandom(false);
        }
        clearFieldError("selectedClasses");
    };

    const handleToggleSchool = (s: string, checked: boolean) => {
        // any manual interaction means "not random"
        if (schoolsRandom) setSchoolsRandom(false);
        setSelectedSchools((cur) =>
            checked
                ? cur.includes(s)
                    ? cur
                    : [...cur, s]
                : cur.filter((x) => x !== s)
        );
        clearFieldError("selectedSchools");
    };

    const handleSelectAllSchools = () => setSelectedSchools([...SCHOOLS]);
    const handleClearSchools = () => setSelectedSchools([]);

    const submit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const parsed = getSpellbookSchema(isPaid && !!user?.id).safeParse({
            name,
            level: selectedLevel,
            schoolsRandom,
            selectedSchools,
            classesRandom,
            selectedClasses,
            selectedSources,
            excludeLegacy,
        });
        if (!parsed.success) {
            const fieldErrors: Record<string, string> = {};
            for (const issue of parsed.error.issues) {
                const key = (issue.path[0] as string) || "form";
                if (!fieldErrors[key]) fieldErrors[key] = issue.message;
            }
            setErrors(fieldErrors);
            return;
        }

        // Handle edit mode - instant name update using InstantDB
        if (mode === "edit" && initial?.id) {
            const spellbookId = initial.id;
            await updateSpellbook({ id: spellbookId, name });
            setDialogOpen(false);
            return;
        }

        // Handle create mode - client-side generation
        const schoolsResult: string[] | "random" = schoolsRandom
            ? "random"
            : selectedSchools;
        const classesResult: string[] | "random" = classesRandom
            ? "random"
            : selectedClasses;

        // If level is "random", pick a numeric level client-side (1-20)
        let chosenLevel: number | "random";
        if (selectedLevel === "random") {
            chosenLevel = "random";
        } else {
            chosenLevel = parseInt(selectedLevel, 10);
        }

        setIsGenerating(true);
        try {
            const result = await generateSpellbookClient({
                level: chosenLevel,
                schools: schoolsResult,
                classes: classesResult,
                sourceShorts: selectedSources.length > 0 ? selectedSources : undefined,
                excludeLegacy,
                name: isPaid && user?.id ? name.trim() : undefined,
                userId: isPaid && user?.id ? user.id : null,
                userSettings: settings,
                allSpells,
            });

            if (mode === "create" && typeof result === "string" && result) {
                // Spellbook saved successfully
                setDialogOpen(false);
                return;
            }

            // If free/guest (no saved ID), download CSV instead of redirecting
            if (
                typeof result !== "string" &&
                result &&
                Array.isArray(result.spells)
            ) {
                const csv = spellsToCsv(result.spells);
                const fileName = buildSpellbookFilename(name || "Spellbook");
                downloadCsv(csv, fileName);
                setDialogOpen(false);
                return;
            }
            setDialogOpen(false);
        } catch (err: any) {
            console.error("generate error", err);
            const msg =
                err?.message ||
                err?.body?.message ||
                (typeof err === "string" ? err : "Generation failed");
            setErrors({ form: String(msg) });
            setDialogOpen(true);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Credenza
            open={dialogOpen}
            onOpenChange={setDialogOpen}
        >
            <CredenzaContent className="sm:max-w-md p-5">
                <form
                    onSubmit={(e) => void submit(e)}
                    className="space-y-4"
                >
                    <CredenzaHeader>
                        <CredenzaTitle
                            className={
                                hideTitleOnMobile ? "hidden sm:block" : ""
                            }
                        >
                            {mode === "edit"
                                ? "Rename Spellbook"
                                : "Generate Spellbook"}
                        </CredenzaTitle>
                    </CredenzaHeader>

                    <CredenzaBody className="space-y-5">
                        {errors.form ? (
                            <div className="text-sm text-red-600">
                                {errors.form}
                            </div>
                        ) : null}

                        {isPaid && user?.id ? (
                            <SpellbookNameField
                                value={name}
                                onChange={(v) => {
                                    setName(v);
                                    clearFieldError("form");
                                    clearFieldError("name");
                                }}
                                id="name"
                                nameAttr="name"
                                placeholder="e.g., Neera's Apprentice Grimoire"
                            />
                        ) : null}
                        {errors.name ? (
                            <p className="text-sm text-red-600 mt-1">
                                {errors.name}
                            </p>
                        ) : null}

                        {/* Only show generation options in create mode */}
                        {mode === "create" && (
                            <>
                                <div>
                                    <Label htmlFor="level">
                                        Character Level
                                    </Label>

                                    <Select
                                        value={selectedLevel}
                                        onValueChange={(v) => {
                                            setSelectedLevel(v);
                                            clearFieldError("level");
                                        }}
                                    >
                                        <SelectTrigger
                                            id="level"
                                            className="mt-1 w-full"
                                        >
                                            <SelectValue placeholder="Select level" />
                                        </SelectTrigger>

                                        <SelectContent>
                                            <SelectItem value="random">
                                                Random
                                            </SelectItem>
                                            {Array.from(
                                                { length: 20 },
                                                (_, i) => i + 1
                                            ).map((n) => (
                                                <SelectItem
                                                    key={n}
                                                    value={String(n)}
                                                >
                                                    {n}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <input
                                        type="hidden"
                                        name="level"
                                        value={selectedLevel}
                                    />
                                    {errors.level ? (
                                        <p className="text-sm text-red-600 mt-1">
                                            {errors.level}
                                        </p>
                                    ) : null}
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <Label>Class</Label>
                                    </div>

                                    {/* Class select now includes Random as the first item.
                                When Random is selected we set classesRandom = true
                                and selectedClasses = []; otherwise we set selectedClasses = [value]. */}
                                    <Select
                                        value={
                                            classesRandom
                                                ? "random"
                                                : selectedClasses[0] ?? "Wizard"
                                        }
                                        onValueChange={(v) => {
                                            if (v === "random") {
                                                toggleClassesRandom(true);
                                            } else {
                                                if (classesRandom)
                                                    toggleClassesRandom(false);
                                                setSelectedClasses([v]);
                                            }
                                            clearFieldError("selectedClasses");
                                        }}
                                    >
                                        <SelectTrigger className="mt-1 w-full">
                                            <SelectValue placeholder="Select class" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="random">
                                                Random
                                            </SelectItem>
                                            {CLASSES.map((c) => (
                                                <SelectItem
                                                    key={c}
                                                    value={c}
                                                >
                                                    {c}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    {/* Hidden input for server: "random" or classes[] */}
                                    {classesRandom ? (
                                        <input
                                            type="hidden"
                                            name="classes"
                                            value="random"
                                        />
                                    ) : (
                                        <input
                                            type="hidden"
                                            name="classes[]"
                                            value={
                                                selectedClasses[0] ?? "Wizard"
                                            }
                                        />
                                    )}
                                    {errors.selectedClasses ? (
                                        <p className="text-sm text-red-600 mt-1">
                                            {errors.selectedClasses}
                                        </p>
                                    ) : null}
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <Label>Schools of Magic</Label>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-2">
                                                <Checkbox
                                                    id="schools-random"
                                                    name="schools-random"
                                                    checked={schoolsRandom}
                                                    onCheckedChange={(v) =>
                                                        toggleSchoolsRandom(
                                                            v === true
                                                        )
                                                    }
                                                />
                                                <Label htmlFor="schools-random">
                                                    Random
                                                </Label>
                                            </div>

                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    schoolsRandom
                                                        ? handleSelectAllSchools()
                                                        : allSchoolsSelected
                                                        ? handleClearSchools()
                                                        : handleSelectAllSchools()
                                                }
                                                disabled={schoolsRandom}
                                            >
                                                {allSchoolsSelected
                                                    ? "Clear"
                                                    : "Select All"}
                                            </Button>
                                        </div>
                                    </div>

                                    {/* If schoolsRandom, submit a hidden value "random" */}
                                    {schoolsRandom && (
                                        <input
                                            type="hidden"
                                            name="schools"
                                            value="random"
                                        />
                                    )}

                                    <div className="grid grid-cols-2 gap-2">
                                        {SCHOOLS.map((s) => {
                                            const id = `school-${s.replace(
                                                /\s+/g,
                                                "-"
                                            )}`;
                                            const checked =
                                                selectedSchools.includes(s);
                                            return (
                                                <div
                                                    key={s}
                                                    className="flex items-center gap-2 text-sm"
                                                >
                                                    <Checkbox
                                                        id={id}
                                                        name="schools[]"
                                                        value={s}
                                                        checked={checked}
                                                        disabled={schoolsRandom}
                                                        onCheckedChange={(v) =>
                                                            handleToggleSchool(
                                                                s,
                                                                v === true
                                                            )
                                                        }
                                                    />
                                                    <Label htmlFor={id}>
                                                        {s}
                                                    </Label>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {errors.selectedSchools ? (
                                        <p className="text-sm text-red-600 mt-1">
                                            {errors.selectedSchools}
                                        </p>
                                    ) : null}
                                </div>

                                {/* Source shorts */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <Label>Sources</Label>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    allSourcesSelected
                                                        ? setSelectedSources([])
                                                        : setSelectedSources([
                                                              ...SOURCE_SHORTS,
                                                          ])
                                                }
                                            >
                                                {allSourcesSelected
                                                    ? "Clear"
                                                    : "Select All"}
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Hidden inputs for selected sources so server always receives them */}
                                    <div className="grid grid-cols-3 gap-2">
                                        {SOURCE_SHORTS.map((s) => {
                                            const id = `source-${s}`;
                                            const checked =
                                                selectedSources.includes(s);
                                            return (
                                                <div
                                                    key={s}
                                                    className="flex items-center gap-2 text-sm"
                                                >
                                                    <Checkbox
                                                        id={id}
                                                        name="sourceShorts[]"
                                                        value={s}
                                                        checked={checked}
                                                        onCheckedChange={(v) =>
                                                            setSelectedSources(
                                                                (cur) =>
                                                                    v === true
                                                                        ? cur.includes(
                                                                              s
                                                                          )
                                                                            ? cur
                                                                            : [
                                                                                  ...cur,
                                                                                  s,
                                                                              ]
                                                                        : cur.filter(
                                                                              (
                                                                                  x
                                                                              ) =>
                                                                                  x !==
                                                                                  s
                                                                          )
                                                            )
                                                        }
                                                    />
                                                    <Label htmlFor={id}>
                                                        {s.toUpperCase()}
                                                    </Label>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Exclude Legacy */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <Label htmlFor="exclude-legacy">
                                            Exclude Legacy
                                        </Label>
                                        <div className="flex items-center gap-3">
                                            <Switch
                                                id="exclude-legacy-switch"
                                                checked={excludeLegacy}
                                                onCheckedChange={(v) =>
                                                    setExcludeLegacy(v === true)
                                                }
                                            />
                                            <Toggle
                                                aria-label="Exclude Legacy"
                                                pressed={excludeLegacy}
                                                onPressedChange={(v) =>
                                                    setExcludeLegacy(v === true)
                                                }
                                            >
                                                Exclude Legacy
                                            </Toggle>
                                        </div>
                                    </div>
                                    {/* Submit a hidden normalized value to simplify server parsing */}
                                    <input
                                        type="hidden"
                                        name="excludeLegacyNormalized"
                                        value={excludeLegacy ? "1" : "0"}
                                    />
                                </div>
                            </>
                        )}
                    </CredenzaBody>

                    <CredenzaFooter>
                        <CredenzaClose asChild>
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                        </CredenzaClose>

                        <Button
                            type="submit"
                            className="flex-1"
                            disabled={mode === "create" && isGenerating}
                        >
                            {mode === "edit" ? (
                                <>Save</>
                            ) : isGenerating ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Generate Spellbook
                                </>
                            ) : (
                                <>
                                    <Dices className="h-4 w-4" />
                                    Generate Spellbook
                                </>
                            )}
                        </Button>
                    </CredenzaFooter>
                </form>
            </CredenzaContent>
        </Credenza>
    );
}
