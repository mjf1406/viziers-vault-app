/** @format */

"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
import { tx } from "@instantdb/react";
import { toast } from "sonner";
import WorldSelect from "./WorldSelect";
import { Loader2, Plus } from "lucide-react";

type CreateSettlementDialogProps = {
    open: boolean;
    onOpenChange: (v: boolean) => void;
};

export default function CreateSettlementDialog({
    open,
    onOpenChange,
}: CreateSettlementDialogProps) {
    const [worldId, setWorldId] = useState<string | null>(null);
    const [name, setName] = useState<string>("");
    const [population, setPopulation] = useState<string>("");
    const [wealth, setWealth] = useState<string>("modest");
    const [magicLevel, setMagicLevel] = useState<string>("moderate");
    const [shopTypes, setShopTypes] = useState<string[]>(["magic"]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error("Please enter a settlement name");
            return;
        }
        if (!worldId) {
            toast.error("Please select a world");
            return;
        }
        const popNum = Number(population || 0) || 0;

        setIsSubmitting(true);
        try {
            await db.transact(
                tx.settlements[tx.id()].update({
                    name: name.trim(),
                    population: popNum,
                    wealth,
                    magicLevel,
                    shopTypes,
                    world: worldId,
                    createdAt: new Date(),
                })
            );
            toast.success("Settlement created");
            onOpenChange(false);
            setName("");
            setPopulation("");
            setWealth("modest");
            setMagicLevel("moderate");
            setShopTypes(["magic"]);
            setWorldId(null);
        } catch (err) {
            console.error("Create settlement failed", err);
            toast.error("Failed to create settlement");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Credenza
            open={open}
            onOpenChange={onOpenChange}
        >
            <CredenzaContent className="sm:max-w-md p-5">
                <form
                    onSubmit={handleSubmit}
                    className="space-y-4"
                >
                    <CredenzaHeader>
                        <CredenzaTitle>Create Settlement</CredenzaTitle>
                    </CredenzaHeader>
                    <CredenzaBody className="space-y-5">
                        <div className="space-y-2">
                            <Label>World</Label>
                            <WorldSelect
                                value={worldId ?? undefined}
                                onChange={(v) => setWorldId(v)}
                            />
                        </div>
                        <div>
                            <Label htmlFor="settlementName">Name</Label>
                            <Input
                                id="settlementName"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Waterdeep"
                            />
                        </div>
                        <div>
                            <Label htmlFor="population">Population</Label>
                            <Input
                                id="population"
                                inputMode="numeric"
                                value={population}
                                onChange={(e) => setPopulation(e.target.value)}
                                placeholder="e.g., 120000"
                            />
                        </div>
                        <div>
                            <Label>Settlement Wealth</Label>
                            <Select
                                value={wealth}
                                onValueChange={setWealth}
                            >
                                <SelectTrigger className="mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
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
                            <Label>Settlement Magicness</Label>
                            <Select
                                value={magicLevel}
                                onValueChange={setMagicLevel}
                            >
                                <SelectTrigger className="mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
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
                            <Label>Settlement Shop Types</Label>
                            {/* Placeholder simple toggle via select for now */}
                            <Select
                                value={shopTypes.join(",")}
                                onValueChange={(v) =>
                                    setShopTypes(v ? v.split(",") : [])
                                }
                            >
                                <SelectTrigger className="mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="magic">Magic</SelectItem>
                                    <SelectItem value="magic,general">
                                        Magic + General
                                    </SelectItem>
                                    <SelectItem value="magic,blacksmith">
                                        Magic + Blacksmith
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
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                        </CredenzaClose>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Plus className="mr-2 h-4 w-4" /> Create
                                </>
                            )}
                        </Button>
                    </CredenzaFooter>
                </form>
            </CredenzaContent>
        </Credenza>
    );
}

