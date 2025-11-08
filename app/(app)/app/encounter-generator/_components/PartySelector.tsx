/** @format */

"use client";

import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, X } from "lucide-react";
import db from "@/lib/db";

export type PartyData = {
    pcs: Array<{ level: number; quantity: number }>;
} | null;

type PartySelectorProps = {
    value: PartyData;
    onChange: (party: PartyData) => void;
    onTabChange?: (tab: "select" | "manual") => void;
};

export default function PartySelector({
    value,
    onChange,
    onTabChange,
}: PartySelectorProps) {
    const { isLoading, error, data } = db.useQuery({ parties: {} });
    const [activeTab, setActiveTab] = useState<"select" | "manual">("select");
    const [selectedPartyId, setSelectedPartyId] = useState<string | null>(null);
    const [manualLevels, setManualLevels] = useState<
        Array<{ level: number; quantity: number }>
    >([{ level: 1, quantity: 1 }]);

    const parties = (data?.parties ?? []) as any[];

    // When selecting a party
    const handlePartySelect = (partyId: string | null) => {
        setSelectedPartyId(partyId);
        if (partyId) {
            const party = parties.find((p) => p.id === partyId);
            if (party?.pcs) {
                const pcs = Array.isArray(party.pcs)
                    ? party.pcs.map((pc: any) => ({
                          level: pc.level ?? pc.l ?? 1,
                          quantity: pc.quantity ?? pc.q ?? 1,
                      }))
                    : [];
                onChange({ pcs });
            } else {
                onChange(null);
            }
        } else {
            onChange(null);
        }
    };

    // Manual input handlers
    const addManualLevel = () => {
        setManualLevels([...manualLevels, { level: 1, quantity: 1 }]);
    };

    const removeManualLevel = (index: number) => {
        if (manualLevels.length > 1) {
            const updated = manualLevels.filter((_, i) => i !== index);
            setManualLevels(updated);
            onChange({ pcs: updated });
        }
    };

    const updateManualLevel = (
        index: number,
        field: "level" | "quantity",
        val: number
    ) => {
        const updated = [...manualLevels];
        updated[index] = { ...updated[index], [field]: val };
        setManualLevels(updated);
        onChange({ pcs: updated });
    };

    // Notify parent of initial tab state
    React.useEffect(() => {
        onTabChange?.(activeTab);
    }, []); // Only on mount

    // When switching tabs, sync the value
    React.useEffect(() => {
        if (activeTab === "select") {
            // If we have a value and it matches a party, select it
            if (value && selectedPartyId) {
                const party = parties.find((p) => p.id === selectedPartyId);
                if (party) {
                    const partyPcs = Array.isArray(party.pcs)
                        ? party.pcs.map((pc: any) => ({
                              level: pc.level ?? pc.l ?? 1,
                              quantity: pc.quantity ?? pc.q ?? 1,
                          }))
                        : [];
                    const valuePcs = value.pcs || [];
                    // Check if they match
                    if (
                        JSON.stringify(partyPcs) === JSON.stringify(valuePcs)
                    ) {
                        return; // Already synced
                    }
                }
            }
        } else if (activeTab === "manual") {
            // If we have a value, use it for manual input
            if (value?.pcs) {
                setManualLevels(value.pcs);
            }
        }
    }, [activeTab, value, selectedPartyId, parties]);

    if (isLoading) return <div>Loading parties…</div>;
    if (error)
        return (
            <div className="text-destructive">Failed to load parties</div>
        );

    return (
        <div className="space-y-2">
            <Label>Party</Label>
            <Tabs
                value={activeTab}
                onValueChange={(v) => {
                    const tab = v as "select" | "manual";
                    setActiveTab(tab);
                    onTabChange?.(tab);
                }}
            >
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="select">Select Party</TabsTrigger>
                    <TabsTrigger value="manual">Manual Input</TabsTrigger>
                </TabsList>
                <TabsContent value="select" className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Select
                            value={selectedPartyId ?? undefined}
                            onValueChange={handlePartySelect}
                        >
                            <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Select a party" />
                            </SelectTrigger>
                            <SelectContent>
                                {parties.map((party) => (
                                    <SelectItem
                                        key={party.id}
                                        value={party.id}
                                    >
                                        {party.name || "Unnamed Party"}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {selectedPartyId && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handlePartySelect(null)}
                                className="h-10 w-10 shrink-0"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </TabsContent>
                <TabsContent value="manual" className="space-y-2">
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {manualLevels.map((levelData, idx) => (
                            <div
                                key={idx}
                                className="flex items-center gap-2 p-2 border rounded"
                            >
                                <div className="flex-1">
                                    <Label className="text-xs">Level</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={20}
                                        value={levelData.level}
                                        onChange={(e) =>
                                            updateManualLevel(
                                                idx,
                                                "level",
                                                parseInt(e.target.value, 10) ||
                                                    1
                                            )
                                        }
                                        className="mt-1"
                                    />
                                </div>
                                <div className="flex-1">
                                    <Label className="text-xs">Quantity</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        value={levelData.quantity}
                                        onChange={(e) =>
                                            updateManualLevel(
                                                idx,
                                                "quantity",
                                                parseInt(e.target.value, 10) ||
                                                    1
                                            )
                                        }
                                        className="mt-1"
                                    />
                                </div>
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => removeManualLevel(idx)}
                                    className="mt-5"
                                    disabled={manualLevels.length === 1}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addManualLevel}
                        className="w-full"
                    >
                        <Plus className="w-4 h-4 mr-1" /> Add Level
                    </Button>
                </TabsContent>
            </Tabs>
        </div>
    );
}

