/** @format */

"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Credenza,
    CredenzaBody,
    CredenzaClose,
    CredenzaContent,
    CredenzaFooter,
    CredenzaHeader,
    CredenzaTitle,
} from "@/components/ui/credenza";
import { Dices, Loader2, Plus } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import MagicShopNameField from "./MagicShopNameField";
import WorldSelect from "./WorldSelect";
import SettlementSelect from "./SettlementSelect";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import WealthRadio from "@/components/settlements/WealthRadio";
import MagicnessRadio from "@/components/settlements/MagicnessRadio";
import StockTypesCheckboxes from "@/components/settlements/StockTypesCheckboxes";
import CreateWorldResponsiveDialog from "@/app/(app)/app/world-generator/_components/CreateWorldResponsiveDialog";
import CreateSettlementResponsiveDialog from "@/app/(app)/app/world-generator/_components/CreateSettlementResponsiveDialog";
import { NumberInputWithStepper } from "@/components/ui/NumberInputWithStepper";
import db from "@/lib/db";
import { PREMADE_WORLDS } from "@/lib/pre-made-worlds";
import type {
    MagicnessLevel,
    WealthLevel,
    ShopType,
} from "@/lib/constants/settlements";
import { MAGICNESS_LEVELS, WEALTH_LEVELS } from "@/lib/constants/settlements";
import generateMagicShop from "../_actions/generateMagicShop";
import type { GenerateMagicShopResponse } from "../_actions/generateMagicShop";
import {
    buildMagicShopFilename,
    downloadCsv as downloadShopCsv,
    shopsToCsv,
} from "./DownloadMagicShopCSVButton";
import { z } from "zod";

export type GenerateMagicShopOpts = {
    population?: number | null;
    wealth: WealthLevel | number | "random";
    magicness: MagicnessLevel | number | "random";
    stockTypes?: ShopType[] | null;
    worldId?: string | null;
    settlementId?: string | null;
    quantity?: number;
    overrideWealth?: GenerateMagicShopOpts["wealth"] | null;
    stockIntensity?: "sparse" | "normal" | "lush";
    stockMultiplier?: number | null;
    inputMode?: "by-population" | "by-settlement";
    settings?: any | null;
    // Snapshot of worlds (with nested settlements) to resolve population in actions without querying
    worlds?: any[] | null;
};

type MagicShopInitial = {
    id?: string;
    name?: string;
    population?: GenerateMagicShopOpts["population"];
    wealth?: GenerateMagicShopOpts["wealth"];
    magicness?: GenerateMagicShopOpts["magicness"];
};

type MagicShopGeneratorDialogProps = {
    mode?: "create" | "edit";
    initial?: MagicShopInitial | null;
    addPending?: (id: string) => void;
    removePending?: (id: string) => void;
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    onClose?: () => void;
    hideTitleOnMobile?: boolean;
    onGenerate?: (opts: GenerateMagicShopOpts) => Promise<void> | void;
};

export default function MagicShopGeneratorDialog({
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
}: MagicShopGeneratorDialogProps) {
    const { plan, user, settings } = useUser();
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
    const [population, setPopulation] = useState<
        GenerateMagicShopOpts["population"]
    >(typeof initial?.population === "number" ? initial?.population : null);
    const [wealth, setWealth] = useState<WealthLevel | "random">(() => {
        const w = initial?.wealth as any;
        if (typeof w === "number") {
            const idx = Math.min(WEALTH_LEVELS.length - 1, Math.max(0, w));
            return WEALTH_LEVELS[idx] as WealthLevel;
        }
        return (w as WealthLevel) ?? "random";
    });
    const [magicness, setMagicness] = useState<MagicnessLevel | "random">(
        () => {
            const m = initial?.magicness as any;
            if (typeof m === "number") {
                const idx = Math.min(
                    MAGICNESS_LEVELS.length - 1,
                    Math.max(0, m)
                );
                return MAGICNESS_LEVELS[idx] as MagicnessLevel;
            }
            return (m as MagicnessLevel) ?? "random";
        }
    );
    const [stockTypes, setStockTypes] = useState<ShopType[]>([]);

    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [worldId, setWorldId] = useState<string | null>(null);
    const [settlementId, setSettlementId] = useState<string | null>(null);
    const [quantity, setQuantity] = useState<number | null>(1);
    const [overrideWealth, setOverrideWealth] = useState<
        GenerateMagicShopOpts["wealth"] | null
    >(null);
    const [stockMultiplier, setStockMultiplier] = useState<number | null>(1);
    const [worldDialogOpen, setWorldDialogOpen] = useState(false);
    const [settlementDialogOpen, setSettlementDialogOpen] = useState(false);
    const defaultTab = isPaid ? "by-settlement" : "by-population";
    const [activeTab, setActiveTab] = useState<
        "by-population" | "by-settlement"
    >(defaultTab);

    const getMagicShopSchema = (requireName: boolean) =>
        z
            .object({
                name: requireName
                    ? z.string().trim().min(1, "Name is required")
                    : z.string().optional(),
                quantity: z.number().min(1, "Min 1").max(10, "Max 10"),
                stockMultiplier: z
                    .number()
                    .min(0.1, "Min 0.1")
                    .max(10, "Max 10"),
                population: z
                    .number()
                    .int("Population must be an integer")
                    .positive("Population must be positive")
                    .optional()
                    .nullable(),
                settlementId: z.string().min(1).optional().nullable(),
                stockTypes: z
                    .array(z.string())
                    .min(1, "Select at least one type"),
                wealth: z.union([
                    z.number(),
                    z
                        .string()
                        .refine(
                            (v) =>
                                v === "random" ||
                                WEALTH_LEVELS.includes(v as any),
                            "Invalid wealth"
                        ),
                ]),
                magicness: z.union([
                    z.number(),
                    z
                        .string()
                        .refine(
                            (v) =>
                                v === "random" ||
                                MAGICNESS_LEVELS.includes(v as any),
                            "Invalid magicness"
                        ),
                ]),
            })
            .superRefine((val, ctx) => {
                const hasPopulation =
                    typeof val.population === "number" &&
                    Number.isFinite(val.population);
                const hasSettlement =
                    typeof val.settlementId === "string" && !!val.settlementId;
                if (!hasPopulation && !hasSettlement) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        path: ["populationOrSettlement"],
                        message: "Provide a population or choose a settlement",
                    });
                }
            });

    // Load worlds with settlements so we can map a selected city -> its attributes
    const { data: worldsData } = db.useQuery({ worlds: { settlements: {} } });
    const allSettlements = useMemo(() => {
        const worlds = (worldsData?.worlds ?? []) as any[];
        const dbSettlements = worlds.flatMap(
            (w: any) => (w?.settlements ?? []) as any[]
        );

        const premadeSettlements = PREMADE_WORLDS.flatMap((w) =>
            (w.settlements ?? []).map((s) => ({
                // synthesize an id that won't collide with DB ids
                id: `${w.id}:${s.name}`,
                name: s.name,
                wealth: s.wealth,
                magicness: s.magicness,
                shopTypes: s.shopTypes,
            }))
        );

        return [...premadeSettlements, ...dbSettlements];
    }, [worldsData]);

    // When a settlement is selected, auto-populate wealth, magicness, and stock types
    useEffect(() => {
        if (!settlementId) return;
        const s = allSettlements.find((s: any) => s.id === settlementId);
        if (!s) return;
        if (s.wealth) setWealth(s.wealth);
        if (s.magicness) setMagicness(s.magicness);
        if (Array.isArray(s.shopTypes)) setStockTypes(s.shopTypes);
    }, [settlementId, allSettlements]);

    const submit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        // Validate with Zod
        const parsed = getMagicShopSchema(isPaid && !!user?.id).safeParse({
            name,
            quantity: typeof quantity === "number" ? quantity : 1,
            stockMultiplier:
                typeof stockMultiplier === "number" ? stockMultiplier : 1,
            population: typeof population === "number" ? population : null,
            settlementId: settlementId ?? null,
            stockTypes: stockTypes ?? [],
            wealth,
            magicness,
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

        // Resolve randoms client-side for now
        const resolveRandom = <T extends string>(
            current: T,
            choices: T[]
        ): T => {
            if (current !== ("random" as T)) return current;
            return choices[Math.floor(Math.random() * choices.length)];
        };

        // Normalize wealth to an integer index
        const resolvedWealthNumeric = (() => {
            if (typeof wealth === "number") {
                const n = Math.round(wealth);
                return Math.min(WEALTH_LEVELS.length - 1, Math.max(0, n));
            }
            const str = resolveRandom(
                wealth as any,
                WEALTH_LEVELS as any
            ) as WealthLevel;
            const idx = WEALTH_LEVELS.indexOf(str);
            return idx >= 0 ? idx : 0;
        })();
        // Normalize magicness to an integer index
        const resolvedMagicnessNumeric = (() => {
            if (typeof magicness === "number") {
                const n = Math.round(magicness);
                return Math.min(MAGICNESS_LEVELS.length - 1, Math.max(0, n));
            }
            const str = resolveRandom(
                magicness as any,
                MAGICNESS_LEVELS as any
            ) as MagicnessLevel;
            const idx = MAGICNESS_LEVELS.indexOf(str);
            return idx >= 0 ? idx : 0;
        })();

        setIsGenerating(true);
        try {
            const qty = Math.min(10, Math.max(1, Number(quantity) || 1));
            const payload: GenerateMagicShopOpts = {
                population:
                    typeof population === "number" &&
                    Number.isFinite(population)
                        ? population
                        : null,
                wealth: resolvedWealthNumeric,
                magicness: resolvedMagicnessNumeric,
                stockTypes: stockTypes ?? undefined,
                worldId,
                settlementId,
                quantity: qty,
                overrideWealth,
                stockMultiplier:
                    typeof stockMultiplier === "number" &&
                    Number.isFinite(stockMultiplier)
                        ? stockMultiplier
                        : null,
                inputMode: activeTab,
                settings,
                worlds: (worldsData?.worlds as any[]) ?? [],
            };

            if (mode === "create") {
                try {
                    const result: GenerateMagicShopResponse =
                        await generateMagicShop(
                            {
                                name:
                                    isPaid && user?.id
                                        ? (name || "").trim() || undefined
                                        : undefined,
                                options: payload,
                                quantity: qty,
                            },
                            { id: user?.id ?? null, plan: plan ?? null }
                        );
                    // If free/guest: server returns payload with shops, download CSV
                    if (result && typeof result !== "object") {
                        // array of ids -> paid flow
                        setDialogOpen(false);
                        return;
                    }
                    if (
                        result &&
                        typeof result === "object" &&
                        Array.isArray((result as any).shops)
                    ) {
                        const shopsPayload = (result as any).shops as any[];
                        // For CSV, combine shops into one file; include shop name in first column
                        const csv = shopsToCsv(
                            shopsPayload.map((s) => ({
                                name: s?.name ?? name ?? "Magic Shop",
                                items: s?.items ?? {
                                    gear: [],
                                    scrolls: [],
                                    components: [],
                                },
                            }))
                        );
                        const fileName = buildMagicShopFilename(
                            name || "Magic Shop"
                        );
                        downloadShopCsv(csv, fileName);
                        setDialogOpen(false);
                        return;
                    }
                } catch (err: any) {
                    const msg =
                        err?.message ||
                        (typeof err === "string" ? err : "Generation failed");
                    setErrors({ form: String(msg) });
                    setDialogOpen(true);
                    return;
                }

                setDialogOpen(false);
                return;
            }

            // Edit mode: allow parent to update options; update name instantly client-side
            if (mode === "edit" && initial?.id) {
                try {
                    await db.transact(
                        db.tx.magicShops[initial.id].update({
                            name: (name || "").trim() || undefined,
                            updatedAt: new Date(),
                        })
                    );
                } catch {}
            }

            if (onGenerate) await onGenerate(payload);
            setDialogOpen(false);
        } catch (err: any) {
            console.error("Magic shop generation failed", err);
            setErrors({ form: String(err?.message || "Generation failed") });
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
                                ? "Edit Magic Shop"
                                : "Generate Magic Shop"}
                        </CredenzaTitle>
                    </CredenzaHeader>

                    <CredenzaBody className="space-y-5">
                        {errors.form ? (
                            <div className="text-sm text-red-600">
                                {errors.form}
                            </div>
                        ) : null}
                        {isPaid && user?.id ? (
                            <MagicShopNameField
                                value={name}
                                onChange={(v) => {
                                    setName(v);
                                    clearFieldError("form");
                                    clearFieldError("name");
                                }}
                                id="name"
                                nameAttr="name"
                                placeholder="e.g., Neera's Gilded Emporium"
                            />
                        ) : null}
                        {errors.name ? (
                            <p className="text-sm text-red-600 mt-1">
                                {errors.name}
                            </p>
                        ) : null}

                        <Tabs
                            value={activeTab}
                            onValueChange={(v) =>
                                setActiveTab(
                                    v as "by-population" | "by-settlement"
                                )
                            }
                            className="w-full"
                        >
                            <TabsList>
                                <TabsTrigger
                                    value="by-population"
                                    className="w-1/2"
                                >
                                    By population
                                </TabsTrigger>
                                <TabsTrigger
                                    value="by-settlement"
                                    className="w-1/2"
                                >
                                    By world & city
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent
                                value="by-population"
                                className="space-y-3"
                            >
                                <Field>
                                    <FieldLabel htmlFor="population">
                                        Population
                                    </FieldLabel>
                                    <NumberInputWithStepper
                                        placeholder="e.g., 20000"
                                        value={population ?? null}
                                        inputClassName="w-64"
                                        onChange={(v) => {
                                            setWorldId(null);
                                            setSettlementId(null);
                                            setPopulation(
                                                typeof v === "number" ? v : null
                                            );
                                            clearFieldError("population");
                                            clearFieldError(
                                                "populationOrSettlement"
                                            );
                                        }}
                                        min={1}
                                        step={100}
                                        modifierSteps={{
                                            ctrlOrMeta: 200,
                                            shift: 500,
                                            alt: 1000,
                                            ctrlAlt: 5000,
                                            ctrlShift: 10000,
                                        }}
                                    />
                                    {errors.population ? (
                                        <p className="text-sm text-red-600 mt-1">
                                            {errors.population}
                                        </p>
                                    ) : null}
                                    {errors.populationOrSettlement ? (
                                        <p className="text-sm text-red-600 mt-1">
                                            {errors.populationOrSettlement}
                                        </p>
                                    ) : null}
                                </Field>
                            </TabsContent>

                            <TabsContent
                                value="by-settlement"
                                className="space-y-3"
                            >
                                <FieldGroup className="flex !flex-row gap-4">
                                    <Field className="">
                                        <FieldLabel>Pick a world</FieldLabel>
                                        <div className="flex items-center gap-1">
                                            <div className="flex-1">
                                                <WorldSelect
                                                    value={worldId ?? undefined}
                                                    onChange={(v) => {
                                                        setWorldId(v);
                                                        setSettlementId(null);
                                                    }}
                                                    placeholder="Select world"
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                aria-label="Create world"
                                                onClick={() =>
                                                    setWorldDialogOpen(true)
                                                }
                                            >
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </Field>
                                    <Field className="">
                                        <FieldLabel>
                                            Pick a settlement
                                        </FieldLabel>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1">
                                                <SettlementSelect
                                                    worldId={worldId}
                                                    value={
                                                        settlementId ??
                                                        undefined
                                                    }
                                                    onChange={(v) => {
                                                        setSettlementId(v);
                                                        clearFieldError(
                                                            "settlementId"
                                                        );
                                                        clearFieldError(
                                                            "populationOrSettlement"
                                                        );
                                                    }}
                                                    placeholder="Select settlement"
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                aria-label="Create settlement"
                                                onClick={() =>
                                                    setSettlementDialogOpen(
                                                        true
                                                    )
                                                }
                                                disabled={!worldId}
                                                aria-disabled={!worldId}
                                                className="disabled:cursor-not-allowed"
                                            >
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </Field>
                                </FieldGroup>
                                {errors.settlementId ? (
                                    <p className="text-sm text-red-600 mt-1">
                                        {errors.settlementId}
                                    </p>
                                ) : null}
                                {errors.populationOrSettlement ? (
                                    <p className="text-sm text-red-600 mt-1">
                                        {errors.populationOrSettlement}
                                    </p>
                                ) : null}
                            </TabsContent>
                        </Tabs>

                        {/* Quantity and Stock Multiplier side-by-side */}
                        <FieldGroup className="grid grid-cols-2 gap-4">
                            <Field>
                                <FieldLabel htmlFor="quantity">
                                    Quantity of shops
                                </FieldLabel>
                                <NumberInputWithStepper
                                    value={quantity ?? 1}
                                    onChange={(v) => {
                                        setQuantity(
                                            typeof v === "number"
                                                ? Math.min(10, Math.max(1, v))
                                                : 1
                                        );
                                        clearFieldError("quantity");
                                    }}
                                    min={1}
                                    max={10}
                                    step={1}
                                    modifierSteps={{
                                        ctrlOrMeta: 2,
                                        shift: 5,
                                        alt: 10,
                                    }}
                                />
                                {errors.quantity ? (
                                    <p className="text-sm text-red-600 mt-1">
                                        {errors.quantity}
                                    </p>
                                ) : null}
                            </Field>
                            <Field>
                                <FieldLabel>Stock multiplier</FieldLabel>
                                <NumberInputWithStepper
                                    value={stockMultiplier ?? 1}
                                    onChange={(v) => {
                                        setStockMultiplier(
                                            typeof v === "number" && v >= 0.1
                                                ? v
                                                : 0.1
                                        );
                                        clearFieldError("stockMultiplier");
                                    }}
                                    min={0.1}
                                    max={10}
                                    step={0.1}
                                    modifierSteps={{
                                        ctrlOrMeta: 0.5,
                                        shift: 1,
                                        alt: 2,
                                    }}
                                />
                                {errors.stockMultiplier ? (
                                    <p className="text-sm text-red-600 mt-1">
                                        {errors.stockMultiplier}
                                    </p>
                                ) : null}
                            </Field>
                        </FieldGroup>

                        <div className="space-y-2">
                            <Label>Wealth</Label>
                            <WealthRadio
                                value={wealth}
                                onChange={(v) => setWealth(v as any)}
                                includeRandom
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Magicness</Label>
                            <MagicnessRadio
                                value={magicness}
                                onChange={(v) => setMagicness(v as any)}
                                includeRandom
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Stock Types</Label>
                            <StockTypesCheckboxes
                                values={stockTypes}
                                onChange={(vals) => {
                                    setStockTypes(vals);
                                    clearFieldError("stockTypes");
                                }}
                            />
                            {errors.stockTypes ? (
                                <p className="text-sm text-red-600 mt-1">
                                    {errors.stockTypes}
                                </p>
                            ) : null}
                        </div>

                        {/* Stock multiplier moved next to quantity above */}

                        <CreateWorldResponsiveDialog
                            open={worldDialogOpen}
                            onOpenChange={setWorldDialogOpen}
                            onCreated={(id) => {
                                setWorldId(id);
                                setWorldDialogOpen(false);
                            }}
                        />
                        <CreateSettlementResponsiveDialog
                            open={settlementDialogOpen}
                            onOpenChange={setSettlementDialogOpen}
                            defaultWorldId={worldId ?? undefined}
                            onCreated={(sid, wid) => {
                                setWorldId(wid);
                                setSettlementId(sid);
                                setSettlementDialogOpen(false);
                            }}
                        />
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
                                    Generate Magic Shop
                                </>
                            ) : (
                                <>
                                    <Dices className="h-4 w-4" />
                                    Generate Magic Shop
                                </>
                            )}
                        </Button>
                    </CredenzaFooter>
                </form>
            </CredenzaContent>
        </Credenza>
    );
}
