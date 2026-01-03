/** @format */

"use client";

import { useState, useEffect } from "react";
import { Swords, Dices, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/useUser";
import { parseAsBoolean, useQueryState } from "nuqs";
import EncountersGrid from "./_components/EncountersGrid";
import RollEncounterDialog from "./_components/RollEncounterDialog";
import GenerateEncounterDialog from "./_components/GenerateEncounterDialog";
import EncounterUpsell from "./_components/EncounterUpsell";

// Separate component for data-dependent content
function EncounterContent({ onEdit }: { onEdit: (e: any) => void }) {
    const { plan, user } = useUser();

    if (!user || plan === "Free") {
        return <EncounterUpsell />;
    }

    return <EncountersGrid onEdit={onEdit} />;
}

export default function EncounterGeneratorPage() {
    const [createOpen, setCreateOpen] = useState(false);
    const [generateOpen, setGenerateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editingEncounter, setEditingEncounter] = useState<any | null>(null);
    const [rollDialogOpen, setRollDialogOpen] = useQueryState(
        "roll",
        parseAsBoolean.withDefault(false)
    );
    const [generateDialogOpen, setGenerateDialogOpen] = useQueryState(
        "generate",
        parseAsBoolean.withDefault(false)
    );
    const { isLoading } = useUser();

    // Sync roll dialog with query parameter
    useEffect(() => {
        if (rollDialogOpen && !createOpen) {
            setCreateOpen(true);
        }
        if (!rollDialogOpen && createOpen) {
            setCreateOpen(false);
        }
    }, [rollDialogOpen, createOpen]);

    // Sync generate dialog with query parameter
    useEffect(() => {
        if (generateDialogOpen && !generateOpen) {
            setGenerateOpen(true);
        }
        if (!generateDialogOpen && generateOpen) {
            setGenerateOpen(false);
        }
    }, [generateDialogOpen, generateOpen]);

    const handleCreateOpenChange = (v: boolean) => {
        setCreateOpen(v);
        setRollDialogOpen(v);
    };

    const handleGenerateOpenChange = (v: boolean) => {
        setGenerateOpen(v);
        setGenerateDialogOpen(v);
    };

    const openForEdit = (e: any) => {
        const r = e?._raw ?? e ?? {};
        const id = r.id ?? r._id ?? r.encounterId ?? "";
        const name = r.name ?? "Untitled Encounter";
        setEditingEncounter({ id, name });
        setEditOpen(true);
    };

    const handleEditOpenChange = (v: boolean) => {
        setEditOpen(v);
        if (!v) setEditingEncounter(null);
    };

    return (
        <div className="space-y-6 p-4 xl:p-10 min-h-dvh">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold flex gap-3 items-center justify-center">
                    <Swords />
                    My Encounters
                </h1>

                <div className="flex items-center gap-3">
                    <Button
                        className="hidden sm:inline-flex"
                        onClick={() => handleGenerateOpenChange(true)}
                    >
                        <Plus className="w-4 h-4" />
                        Generate Encounter(s)
                    </Button>
                    <Button
                        className="hidden sm:inline-flex"
                        onClick={() => handleCreateOpenChange(true)}
                    >
                        <Dices className="w-4 h-4" />
                        Roll for Encounter(s)
                    </Button>

                    <Button
                        onClick={() => handleGenerateOpenChange(true)}
                        aria-label="Generate Encounter"
                        size="icon"
                        variant="default"
                        className="sm:hidden fixed bottom-12 right-6 z-50 w-12 h-12 rounded-full p-0 flex items-center justify-center shadow-lg"
                    >
                        <Plus
                            className="!w-7 !h-7"
                            size={36}
                        />
                    </Button>
                </div>

                {!isLoading && (
                    <>
                        <GenerateEncounterDialog
                            open={generateOpen}
                            onOpenChange={handleGenerateOpenChange}
                            hideTitleOnMobile={true}
                        />
                        <RollEncounterDialog
                            mode="create"
                            open={createOpen}
                            onOpenChange={handleCreateOpenChange}
                            hideTitleOnMobile={true}
                        />
                    </>
                )}

                {!isLoading && editingEncounter && (
                    <RollEncounterDialog
                        key={
                            "encounter-edit-" +
                            (editingEncounter.id ??
                                editingEncounter._id ??
                                String(Date.now()))
                        }
                        mode="edit"
                        initial={{
                            id:
                                editingEncounter.id ??
                                editingEncounter._id ??
                                editingEncounter.encounterId,
                            name: editingEncounter.name ?? "",
                        }}
                        open={editOpen}
                        onOpenChange={handleEditOpenChange}
                        hideTitleOnMobile={true}
                    />
                )}
            </div>

            <EncounterContent onEdit={(e) => openForEdit(e)} />
        </div>
    );
}
