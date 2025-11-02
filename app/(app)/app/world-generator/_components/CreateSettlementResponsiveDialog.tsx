/** @format */

"use client";

import React, { useEffect, useMemo, useState } from "react";
import { id as genId } from "@instantdb/react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { NumberInputWithStepper } from "@/components/ui/NumberInputWithStepper";
import {
    Credenza,
    CredenzaBody,
    CredenzaClose,
    CredenzaContent,
    CredenzaFooter,
    CredenzaHeader,
    CredenzaTitle,
} from "@/components/ui/credenza";
import db from "@/lib/db";
import { useUser } from "@/hooks/useUser";
import { toast } from "sonner";
import WorldSelect from "@/app/(app)/app/magic-shop-generator/_components/WorldSelect";
import WealthRadio from "@/components/settlements/WealthRadio";
import MagicnessRadio from "@/components/settlements/MagicnessRadio";
import StockTypesCheckboxes from "@/components/settlements/StockTypesCheckboxes";
import type {
    MagicnessLevel,
    ShopType,
    WealthLevel,
} from "@/lib/constants/settlements";

type Props = {
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    defaultWorldId?: string | null;
    onCreated?: (settlementId: string, worldId: string) => void;
};

export default function CreateSettlementResponsiveDialog({
    open,
    defaultOpen,
    onOpenChange,
    defaultWorldId,
    onCreated,
}: Props) {
    const { user } = useUser();
    const [openLocal, setOpenLocal] = useState<boolean>(!!defaultOpen);
    const isControlled = typeof open !== "undefined";
    const dialogOpen = isControlled ? open : openLocal;
    const setDialogOpen = (v: boolean) => {
        if (!isControlled) setOpenLocal(v);
        onOpenChange?.(v);
    };

    const [worldId, setWorldId] = useState<string | null>(
        defaultWorldId ?? null
    );
    const [name, setName] = useState("");
    const [population, setPopulation] = useState<number | null>(null);
    const [wealth, setWealth] = useState<WealthLevel | "random" | undefined>(
        undefined
    );
    const [magicness, setMagicness] = useState<
        MagicnessLevel | "random" | undefined
    >(undefined);
    const [shopTypes, setShopTypes] = useState<ShopType[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // When the dialog opens, initialize the local world selection from the prop
    useEffect(() => {
        if (dialogOpen) {
            setWorldId(defaultWorldId ?? null);
        }
    }, [dialogOpen, defaultWorldId]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = name.trim();
        const pop = typeof population === "number" ? population : NaN;
        if (!worldId) {
            toast.error("Please select a world");
            return;
        }
        if (!trimmed) {
            toast.error("Please enter a settlement name");
            return;
        }
        if (!Number.isFinite(pop) || pop < 0) {
            toast.error("Please enter a valid population");
            return;
        }
        if (!user?.id) {
            toast.error("You must be logged in to create settlements");
            return;
        }
        const newId = genId();
        setIsSaving(true);
        try {
            await db.transact(
                db.tx.settlements[newId]
                    .create({
                        name: trimmed,
                        population: pop,
                        wealth,
                        magicness,
                        shopTypes,
                        createdAt: new Date(),
                    })
                    .link({ owner: user.id, world: worldId })
            );
            onCreated?.(newId, worldId);
            setDialogOpen(false);
            setName("");
            setPopulation(null);
            setWealth(undefined);
            setMagicness(undefined);
            setShopTypes([]);
        } catch (err: any) {
            console.error("Create settlement failed", err);
            toast.error("Create settlement failed");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Credenza
            open={dialogOpen}
            onOpenChange={setDialogOpen}
        >
            <CredenzaContent className="sm:max-w-md p-5">
                <form
                    onSubmit={handleCreate}
                    className="space-y-4"
                >
                    <CredenzaHeader>
                        <CredenzaTitle>Create Settlement</CredenzaTitle>
                    </CredenzaHeader>
                    <CredenzaBody className="space-y-4">
                        <FieldGroup>
                            <Field>
                                <FieldLabel>World</FieldLabel>
                                <WorldSelect
                                    value={worldId ?? undefined}
                                    onChange={setWorldId}
                                />
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="settlement-name">
                                    Name
                                </FieldLabel>
                                <input
                                    id="settlement-name"
                                    className="mt-1 w-full rounded border px-3 py-2"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g., Waterdeep"
                                />
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="population">
                                    Population
                                </FieldLabel>
                                <NumberInputWithStepper
                                    value={population ?? null}
                                    inputClassName="w-64"
                                    onChange={(v) =>
                                        setPopulation(
                                            typeof v === "number" ? v : null
                                        )
                                    }
                                    placeholder="e.g., 120000"
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
                            </Field>
                            <Field>
                                <FieldLabel>Wealth</FieldLabel>
                                <WealthRadio
                                    value={wealth}
                                    onChange={setWealth}
                                />
                            </Field>
                            <Field>
                                <FieldLabel>Magicness</FieldLabel>
                                <MagicnessRadio
                                    value={magicness}
                                    onChange={setMagicness}
                                />
                            </Field>
                            <Field>
                                <FieldLabel>Stock Types</FieldLabel>
                                <StockTypesCheckboxes
                                    values={shopTypes}
                                    onChange={setShopTypes}
                                />
                            </Field>
                        </FieldGroup>
                    </CredenzaBody>
                    <CredenzaFooter className="flex items-center justify-between gap-3">
                        <CredenzaClose asChild>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={isSaving}
                            >
                                Cancel
                            </Button>
                        </CredenzaClose>
                        <Button
                            type="submit"
                            disabled={isSaving}
                        >
                            Create
                        </Button>
                    </CredenzaFooter>
                </form>
            </CredenzaContent>
        </Credenza>
    );
}
