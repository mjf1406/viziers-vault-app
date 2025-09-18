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
import { toast } from "sonner";
import {
    Credenza,
    CredenzaBody,
    CredenzaClose,
    CredenzaContent,
    CredenzaFooter,
    CredenzaHeader,
    CredenzaTitle,
} from "@/components/ui/credenza";
import generateSpellbook from "../_actions/generateSpellbook";
import { CLASSES, SCHOOLS } from "@/lib/5e-data";
import { Dices, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useUser } from "@/hooks/useUser";
import { useRouter } from "next/navigation";

export type GenerateOpts = {
    level: number | "random";
    schools: string[] | "random";
    classes: string[] | "random";
};

type SpellbookInitial = {
    id?: string;
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
    const { user, plan } = useUser();
    const isPaid = Boolean(plan && plan.toLowerCase() !== "free");
    const [openLocal, setOpenLocal] = useState<boolean>(!!defaultOpen);
    const isControlled = typeof open !== "undefined";
    const dialogOpen = isControlled ? open : openLocal;
    const setDialogOpen = (v: boolean) => {
        if (!isControlled) setOpenLocal(v);
        onOpenChange?.(v);
        if (!isControlled && !v) onClose?.();
    };
    const router = useRouter();

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

    // Classes: default to only Wizard per request
    const [classesRandom, setClassesRandom] = useState<boolean>(
        initial?.classes === "random" ? true : initial?.classes ? false : false
    );
    const [selectedClasses, setSelectedClasses] = useState<string[]>(
        initial?.classes && initial?.classes !== "random"
            ? [...initial.classes]
            : ["Wizard"]
    );

    // store previous selections so toggle Random on/off can restore
    const prevSchoolsRef = useRef<string[] | null>(null);
    const prevClassesRef = useRef<string[] | null>(null);

    useEffect(() => {
        if (initial) {
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
                setSelectedClasses([...initial.classes]);
            } else {
                setClassesRandom(false);
                setSelectedClasses(["Wizard"]);
            }
        } else {
            // defaults when no initial provided
            setSelectedLevel("random");
            setSchoolsRandom(true);
            setSelectedSchools([]);
            setClassesRandom(false);
            setSelectedClasses(["Wizard"]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initial]);

    const [isGenerating, setIsGenerating] = useState(false);
    const [name, setName] = useState<string>("");

    const allSchoolsSelected = selectedSchools.length === SCHOOLS.length;
    const allClassesSelected = selectedClasses.length === CLASSES.length;

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
    };

    const handleToggleClass = (c: string, checked: boolean) => {
        if (classesRandom) setClassesRandom(false);
        setSelectedClasses((cur) =>
            checked
                ? cur.includes(c)
                    ? cur
                    : [...cur, c]
                : cur.filter((x) => x !== c)
        );
    };

    const handleSelectAllSchools = () => setSelectedSchools([...SCHOOLS]);
    const handleClearSchools = () => setSelectedSchools([]);

    const handleSelectAllClasses = () => setSelectedClasses([...CLASSES]);
    const handleClearClasses = () => setSelectedClasses([]);

    const submit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const formEl = e.currentTarget;
        const formData = new FormData(formEl);

        if (isPaid && user?.id) {
            formData.set("name", name.trim());
        } else {
            formData.delete("name");
        }

        // No client credentials; server reads HTTP-only cookies

        const schoolsResult: string[] | "random" = schoolsRandom
            ? "random"
            : selectedSchools;
        const classesResult: string[] | "random" = classesRandom
            ? "random"
            : selectedClasses;

        if (classesResult !== "random" && classesResult.length === 0) {
            toast.error("Select at least one class or choose Random");
            return;
        }
        if (schoolsResult !== "random" && schoolsResult.length === 0) {
            toast.error("Select at least one school or choose Random");
            return;
        }

        setIsGenerating(true);
        try {
            const level =
                selectedLevel === "random"
                    ? "random"
                    : parseInt(selectedLevel, 10);

            // Call server action with FormData
            const result = await generateSpellbook(formData);

            console.log("🚀 ~ submit ~ result:", result);
            // If we created and saved a spellbook (premium logged-in), navigate immediately to its page
            if (mode === "create" && typeof result === "string" && result) {
                router.push(`/app/spellbook-generator/${result}`);
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

            // Otherwise, delegate to onGenerate callback if provided (e.g., edit flow)
            if (onGenerate) {
                await onGenerate({
                    level,
                    schools: schoolsResult,
                    classes: classesResult,
                });
            } else {
                console.log("generate", {
                    level,
                    schools: schoolsResult,
                    classes: classesResult,
                    mode,
                    initialId: initial?.id,
                });
            }

            // Close dialog if we didn't navigate
            setDialogOpen(false);
        } catch (err: any) {
            console.error("generate error", err);
            // Check for middleware-set rate limit message cookie
            if (typeof document !== "undefined") {
                const cookieStr = document.cookie || "";
                const m = cookieStr.match(/(?:^|; )vv_rl_msg=([^;]+)/);
                if (m) {
                    try {
                        const raw = decodeURIComponent(m[1]);
                        // eslint-disable-next-line no-console
                        console.error(raw);
                        toast.error("429 Too Many Requests");
                    } finally {
                        document.cookie = "vv_rl_msg=; path=/; max-age=0";
                    }
                    setDialogOpen(true);
                    return;
                }
            }

            const msg =
                err?.message ||
                err?.body?.message ||
                (typeof err === "string" ? err : "Generation failed");
            toast.error(msg);
            setDialogOpen(true);
        } finally {
            setIsGenerating(false);
        }
    };

    const spellsToCsv = (spells: any[]) => {
        const headers = ["Name", "Level", "School", "Classes", "Source", "URL"];
        const escape = (v: any) => {
            const s = v == null ? "" : String(v);
            const needsQuotes = /[",\n]/.test(s);
            const escaped = s.replace(/"/g, '""');
            return needsQuotes ? `"${escaped}"` : escaped;
        };
        const rows = spells
            .slice()
            .sort((a, b) => (a.level ?? 0) - (b.level ?? 0))
            .map((sp) => [
                sp.name ?? sp.NAME ?? "",
                sp.level ?? "",
                sp.school ?? "",
                Array.isArray(sp.classes) ? sp.classes.join(";") : "",
                sp.source ?? "",
                sp.url ?? sp.LINK ?? "",
            ]);
        const lines = [headers, ...rows]
            .map((r) => r.map(escape).join(","))
            .join("\r\n");
        return lines;
    };

    const buildSpellbookFilename = (base: string) => {
        const stamp = new Date()
            .toISOString()
            .replace(/[:T]/g, "-")
            .slice(0, 16);
        const safe = base.trim() || "Spellbook";
        return `${safe}-${stamp}`;
    };

    const downloadCsv = (csv: string, nameBase: string) => {
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${nameBase}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
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
                                ? "Edit Spellbook"
                                : "Generate Spellbook"}
                        </CredenzaTitle>
                    </CredenzaHeader>

                    <CredenzaBody>
                        {isPaid && user?.id ? (
                            <div>
                                <Label htmlFor="name">Name (optional)</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    placeholder="e.g., Neera's Apprentice Grimoire"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="mt-1"
                                />
                            </div>
                        ) : null}

                        <div>
                            <Label htmlFor="level">Character Level</Label>

                            <Select
                                value={selectedLevel}
                                onValueChange={(v) => setSelectedLevel(v)}
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
                                                toggleSchoolsRandom(v === true)
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
                                    const checked = selectedSchools.includes(s);
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
                                            <Label htmlFor={id}>{s}</Label>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <Label>Classes</Label>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            id="classes-random"
                                            name="classes-random"
                                            checked={classesRandom}
                                            onCheckedChange={(v) =>
                                                toggleClassesRandom(v === true)
                                            }
                                        />
                                        <Label htmlFor="classes-random">
                                            Random
                                        </Label>
                                    </div>

                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                            classesRandom
                                                ? handleSelectAllClasses()
                                                : allClassesSelected
                                                ? handleClearClasses()
                                                : handleSelectAllClasses()
                                        }
                                        disabled={classesRandom}
                                    >
                                        {allClassesSelected
                                            ? "Clear"
                                            : "Select All"}
                                    </Button>
                                </div>
                            </div>

                            {classesRandom && (
                                <input
                                    type="hidden"
                                    name="classes"
                                    value="random"
                                />
                            )}

                            <div className="grid grid-cols-2 gap-2">
                                {CLASSES.map((c) => {
                                    const id = `class-${c.replace(
                                        /\s+/g,
                                        "-"
                                    )}`;
                                    const checked = selectedClasses.includes(c);
                                    return (
                                        <div
                                            key={c}
                                            className="flex items-center gap-2 text-sm"
                                        >
                                            <Checkbox
                                                id={id}
                                                name="classes[]"
                                                value={c}
                                                checked={checked}
                                                disabled={classesRandom}
                                                onCheckedChange={(v) =>
                                                    handleToggleClass(
                                                        c,
                                                        v === true
                                                    )
                                                }
                                            />
                                            <Label htmlFor={id}>{c}</Label>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
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
                            disabled={isGenerating}
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Generate Spellbook
                                </>
                            ) : (
                                <>
                                    {mode === "edit" ? (
                                        <>Save</>
                                    ) : (
                                        <>
                                            <Dices className="h-4 w-4" />
                                            Generate Spellbook
                                        </>
                                    )}
                                </>
                            )}
                        </Button>
                    </CredenzaFooter>
                </form>
            </CredenzaContent>
        </Credenza>
    );
}
