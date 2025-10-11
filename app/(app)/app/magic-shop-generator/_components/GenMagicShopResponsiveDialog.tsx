/** @format */

"use client";

import React, { useEffect, useRef, useState } from "react";
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
import { Dices, Loader2 } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useRouter } from "next/navigation";
import MagicShopNameField from "./MagicShopNameField";
import WorldSelect from "./WorldSelect";
import SettlementSelect from "./SettlementSelect";

export type GenerateMagicShopOpts = {
    population:
        | "hamlet"
        | "village"
        | "town"
        | "city"
        | "metropolis"
        | "random";
    wealth: "poor" | "modest" | "prosperous" | "opulent" | "random";
    magicLevel: "low" | "moderate" | "high" | "legendary" | "random";
    worldId?: string | null;
    settlementId?: string | null;
    quantity?: number;
    overrideWealth?: GenerateMagicShopOpts["wealth"] | null;
    overrideMagicLevel?: GenerateMagicShopOpts["magicLevel"] | null;
    stockIntensity?: "sparse" | "normal" | "lush";
};

type MagicShopInitial = {
    id?: string;
    name?: string;
    population?: GenerateMagicShopOpts["population"];
    wealth?: GenerateMagicShopOpts["wealth"];
    magicLevel?: GenerateMagicShopOpts["magicLevel"];
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
    const [magicLevel, setMagicLevel] = useState<
        GenerateMagicShopOpts["magicLevel"]
    >((initial?.magicLevel as any) ?? "random");

    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [worldId, setWorldId] = useState<string | null>(null);
    const [settlementId, setSettlementId] = useState<string | null>(null);
    const [quantity, setQuantity] = useState<string>("1");
    const [overrideWealth, setOverrideWealth] = useState<
        GenerateMagicShopOpts["wealth"] | null
    >(null);
    const [overrideMagic, setOverrideMagic] = useState<
        GenerateMagicShopOpts["magicLevel"] | null
    >(null);
    const [stockIntensity, setStockIntensity] = useState<
        "sparse" | "normal" | "lush"
    >("normal");

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

        const resolvedPopulation = resolveRandom(population as any, [
            "hamlet",
            "village",
            "town",
            "city",
            "metropolis",
        ]) as GenerateMagicShopOpts["population"];
        const resolvedWealth = resolveRandom(wealth as any, [
            "poor",
            "modest",
            "prosperous",
            "opulent",
        ]) as GenerateMagicShopOpts["wealth"];
        const resolvedMagic = resolveRandom(magicLevel as any, [
            "low",
            "moderate",
            "high",
            "legendary",
        ]) as GenerateMagicShopOpts["magicLevel"];

        setIsGenerating(true);
        try {
            // Placeholder: generation not implemented yet
            const payload: GenerateMagicShopOpts = {
                population: resolvedPopulation,
                wealth: resolvedWealth,
                magicLevel: resolvedMagic,
                worldId,
                settlementId,
                quantity: Math.max(1, Number(quantity) || 1),
                overrideWealth,
                overrideMagicLevel: overrideMagic,
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

                        {/* Step 1: Either choose population OR world+settlement */}
                        <div className="space-y-2">
                            <Label>
                                Pick a world and settlement (optional)
                            </Label>
                            <WorldSelect
                                value={worldId ?? undefined}
                                onChange={(v) => {
                                    setWorldId(v);
                                    setSettlementId(null);
                                }}
                            />
                            <div className="mt-2">
                                <SettlementSelect
                                    worldId={worldId}
                                    value={settlementId ?? undefined}
                                    onChange={(v) => setSettlementId(v)}
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="population">Population</Label>
                            <Select
                                value={population}
                                onValueChange={(v) => setPopulation(v as any)}
                            >
                                <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Random" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="random">
                                        Random
                                    </SelectItem>
                                    <SelectItem value="hamlet">
                                        Hamlet
                                    </SelectItem>
                                    <SelectItem value="village">
                                        Village
                                    </SelectItem>
                                    <SelectItem value="town">Town</SelectItem>
                                    <SelectItem value="city">City</SelectItem>
                                    <SelectItem value="metropolis">
                                        Metropolis
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Next steps */}
                        <div>
                            <Label htmlFor="quantity">Quantity of shops</Label>
                            <input
                                id="quantity"
                                className="mt-1 w-full rounded border px-3 py-2"
                                inputMode="numeric"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                            />
                        </div>

                        <div>
                            <Label>Wealth override (optional)</Label>
                            <Select
                                value={overrideWealth ?? "__default__"}
                                onValueChange={(v) =>
                                    setOverrideWealth(
                                        v === "__default__" ? null : (v as any)
                                    )
                                }
                            >
                                <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Use settlement/world default" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__default__">
                                        Default
                                    </SelectItem>
                                    <SelectItem value="poor">Poor</SelectItem>
                                    <SelectItem value="modest">
                                        Modest
                                    </SelectItem>
                                    <SelectItem value="prosperous">
                                        Prosperous
                                    </SelectItem>
                                    <SelectItem value="opulent">
                                        Opulent
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Magicness override (optional)</Label>
                            <Select
                                value={overrideMagic ?? "__default__"}
                                onValueChange={(v) =>
                                    setOverrideMagic(
                                        v === "__default__" ? null : (v as any)
                                    )
                                }
                            >
                                <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Use settlement/world default" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__default__">
                                        Default
                                    </SelectItem>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="moderate">
                                        Moderate
                                    </SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="legendary">
                                        Legendary
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
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

                        <div>
                            <Label htmlFor="wealth">Wealth</Label>
                            <Select
                                value={wealth}
                                onValueChange={(v) => setWealth(v as any)}
                            >
                                <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Random" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="random">
                                        Random
                                    </SelectItem>
                                    <SelectItem value="poor">Poor</SelectItem>
                                    <SelectItem value="modest">
                                        Modest
                                    </SelectItem>
                                    <SelectItem value="prosperous">
                                        Prosperous
                                    </SelectItem>
                                    <SelectItem value="opulent">
                                        Opulent
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="magicLevel">Magic Level</Label>
                            <Select
                                value={magicLevel}
                                onValueChange={(v) => setMagicLevel(v as any)}
                            >
                                <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Random" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="random">
                                        Random
                                    </SelectItem>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="moderate">
                                        Moderate
                                    </SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="legendary">
                                        Legendary
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CredenzaBody>

                    <CredenzaFooter className="flex items-center justify-between gap-3">
                        <CredenzaClose asChild>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={isGenerating}
                            >
                                Cancel
                            </Button>
                        </CredenzaClose>
                        <Button
                            type="submit"
                            disabled={isGenerating}
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Dices className="mr-2 h-4 w-4" /> Generate
                                </>
                            )}
                        </Button>
                    </CredenzaFooter>
                </form>
            </CredenzaContent>
        </Credenza>
    );
}
