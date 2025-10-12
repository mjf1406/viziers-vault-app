/** @format */

"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { Dices, Loader2, Plus } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useRouter } from "next/navigation";
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
import { NumberStepperInput } from "@/components/ui/number-stepper";
import db from "@/lib/db";
import type {
    MagicnessLevel,
    WealthLevel,
    ShopType,
} from "@/lib/constants/settlements";

export type GenerateMagicShopOpts = {
    population:
        | "hamlet"
        | "village"
        | "town"
        | "city"
        | "metropolis"
        | "random";
    wealth: WealthLevel | "random";
    magicness: MagicnessLevel | "random";
    stockTypes?: ShopType[] | null;
    worldId?: string | null;
    settlementId?: string | null;
    quantity?: number;
    overrideWealth?: GenerateMagicShopOpts["wealth"] | null;
    stockIntensity?: "sparse" | "normal" | "lush";
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
    const router = useRouter();

    const [name, setName] = useState<string>(initial?.name ?? "");
    const [population, setPopulation] = useState<
        GenerateMagicShopOpts["population"]
    >((initial?.population as any) ?? "random");
    const [wealth, setWealth] = useState<GenerateMagicShopOpts["wealth"]>(
        (initial?.wealth as any) ?? "random"
    );
    const [magicness, setMagicness] = useState<
        GenerateMagicShopOpts["magicness"]
    >((initial?.magicness as any) ?? "random");
    const [stockTypes, setStockTypes] = useState<ShopType[]>([]);

    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [worldId, setWorldId] = useState<string | null>(null);
    const [settlementId, setSettlementId] = useState<string | null>(null);
    const [quantity, setQuantity] = useState<number | null>(1);
    const [overrideWealth, setOverrideWealth] = useState<
        GenerateMagicShopOpts["wealth"] | null
    >(null);
    const [stockIntensity, setStockIntensity] = useState<
        "sparse" | "normal" | "lush"
    >("normal");
    const [worldDialogOpen, setWorldDialogOpen] = useState(false);
    const [settlementDialogOpen, setSettlementDialogOpen] = useState(false);

    // Load worlds with settlements so we can map a selected city -> its attributes
    const { data: worldsData } = db.useQuery({ worlds: { settlements: {} } });
    const allSettlements = useMemo(() => {
        const worlds = (worldsData?.worlds ?? []) as any[];
        return worlds.flatMap((w: any) => (w?.settlements ?? []) as any[]);
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

        // Resolve randoms client-side for now
        const resolveRandom = <T extends string>(
            current: T,
            choices: T[]
        ): T => {
            if (current !== ("random" as T)) return current;
            return choices[Math.floor(Math.random() * choices.length)];
        };

        // basic validation
        const qtyRaw = typeof quantity === "number" ? quantity : 1;
        const qty = Math.min(10, Math.max(1, Number(qtyRaw) || 1));
        if (!Number.isFinite(qty) || qty < 1 || qty > 10) {
            toast.error("Please enter a valid quantity");
            return;
        }
        if (!stockTypes || stockTypes.length === 0) {
            toast.error("Please select at least one stock type");
            return;
        }

        const resolvedPopulation = resolveRandom(population as any, [
            "hamlet",
            "village",
            "town",
            "city",
            "metropolis",
        ]) as GenerateMagicShopOpts["population"];
        const resolvedWealth = wealth as GenerateMagicShopOpts["wealth"];
        const resolvedMagicness =
            magicness as GenerateMagicShopOpts["magicness"];

        setIsGenerating(true);
        try {
            // Placeholder: generation not implemented yet
            const payload: GenerateMagicShopOpts = {
                population: resolvedPopulation,
                wealth: resolvedWealth,
                magicness: resolvedMagicness,
                stockTypes: stockTypes ?? undefined,
                worldId,
                settlementId,
                quantity: qty,
                overrideWealth,
                stockIntensity,
            };

            if (onGenerate) {
                await onGenerate(payload);
            } else {
                // For create flow before persistence exists, just toast and close
                toast.success("Magic shop generated (preview)");
            }

            setDialogOpen(false);
        } catch (err) {
            console.error("Magic shop generation failed", err);
            toast.error("Generation failed");
        } finally {
            setIsGenerating(false);
        }
    };

    const defaultTab = isPaid ? "by-settlement" : "by-population";

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
                        {isPaid && user?.id ? (
                            <MagicShopNameField
                                value={name}
                                onChange={setName}
                                id="name"
                                nameAttr="name"
                                placeholder="e.g., Neera's Gilded Emporium"
                            />
                        ) : null}

                        <Tabs
                            defaultValue={defaultTab}
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
                                    <NumberStepperInput
                                        id="population"
                                        placeholder="e.g., 20000"
                                        onValueChange={() => {
                                            setWorldId(null);
                                            setSettlementId(null);
                                            setPopulation("random");
                                        }}
                                        min={0}
                                    />
                                </Field>
                            </TabsContent>

                            <TabsContent
                                value="by-settlement"
                                className="space-y-3"
                            >
                                <div className="space-y-2">
                                    <div className="flex items-end justify-between gap-2">
                                        <div className="flex-1 space-y-2">
                                            <Label>Pick a world</Label>
                                            <WorldSelect
                                                value={worldId ?? undefined}
                                                onChange={(v) => {
                                                    setWorldId(v);
                                                    setSettlementId(null);
                                                }}
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="mt-6"
                                            onClick={() =>
                                                setWorldDialogOpen(true)
                                            }
                                        >
                                            <Plus className="mr-1 h-4 w-4" />{" "}
                                            Create world
                                        </Button>
                                    </div>
                                    <div className="mt-2">
                                        <div className="flex items-end justify-between gap-2">
                                            <div className="flex-1 space-y-2">
                                                <Label>Pick a city</Label>
                                                <SettlementSelect
                                                    worldId={worldId}
                                                    value={
                                                        settlementId ??
                                                        undefined
                                                    }
                                                    onChange={(v) =>
                                                        setSettlementId(v)
                                                    }
                                                />
                                            </div>
                                            {worldId ? (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="mt-6"
                                                    onClick={() =>
                                                        setSettlementDialogOpen(
                                                            true
                                                        )
                                                    }
                                                >
                                                    <Plus className="mr-1 h-4 w-4" />{" "}
                                                    Create settlement
                                                </Button>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>

                        {/* Next steps */}
                        <FieldGroup>
                            <Field>
                                <FieldLabel htmlFor="quantity">
                                    Quantity of shops
                                </FieldLabel>
                                <NumberStepperInput
                                    id="quantity"
                                    value={quantity ?? undefined}
                                    onValueChange={(v) =>
                                        setQuantity(
                                            typeof v === "number"
                                                ? Math.min(10, Math.max(1, v))
                                                : 1
                                        )
                                    }
                                    min={1}
                                    max={10}
                                />
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
                                onChange={setStockTypes}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Shop stock for this generation</Label>
                            <Select
                                value={stockIntensity}
                                onValueChange={(v) =>
                                    setStockIntensity(v as any)
                                }
                            >
                                <SelectTrigger className="mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="sparse">
                                        Sparse
                                    </SelectItem>
                                    <SelectItem value="normal">
                                        Normal
                                    </SelectItem>
                                    <SelectItem value="lush">Lush</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

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
