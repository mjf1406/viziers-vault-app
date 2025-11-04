/** @format */

"use client";

import { useState, useEffect } from "react";
import { Swords, Dices } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/useUser";
import { parseAsInteger, useQueryState } from "nuqs";
import EncountersGrid from "./_components/EncountersGrid";
import EncounterGeneratorDialog from "./_components/GenEncounterResponsiveDialog";

// Separate component for data-dependent content
function EncounterContent({
    pendingIds,
    onEdit,
}: {
    pendingIds: Set<string>;
    onEdit: (e: any) => void;
}) {
    const { plan, user } = useUser();

    // For now, show grid for all users (no upsell yet)
    // TODO: Add upsell component similar to MagicShopUpsell
    if (!user || plan === "Free") {
        return (
            <div className="py-12 text-center flex flex-col items-center justify-center w-full">
                <div>
                    <Swords className="text-muted-foreground w-20 h-20" />
                </div>
                <p className="text-lg text-muted-foreground/70">
                    Upgrade to save encounters
                </p>
            </div>
        );
    }

    return (
        <EncountersGrid
            onEdit={onEdit}
            pendingIds={pendingIds}
        />
    );
}

export default function EncounterGeneratorPage() {
    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editingEncounter, setEditingEncounter] = useState<any | null>(null);
    const [pendingIds, setPendingIds] = useState<Set<string>>(() => new Set());
    const [modalOpen, setModalOpen] = useQueryState(
        "modalOpen",
        parseAsInteger.withDefault(0)
    );
    const { isLoading } = useUser();

    useEffect(() => {
        if (modalOpen === 1 && !createOpen) {
            setCreateOpen(true);
        }
        if (modalOpen !== 1 && createOpen) {
            setCreateOpen(false);
        }
    }, [modalOpen, createOpen]);

    const addPending = (id: string) => {
        setPendingIds((prev) => {
            const next = new Set(prev);
            next.add(id);
            return next;
        });
    };

    const removePending = (id: string) => {
        setPendingIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
    };

    const handleCreateOpenChange = (v: boolean) => {
        setCreateOpen(v);
        setModalOpen(v ? 1 : 0);
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
                        onClick={() => handleCreateOpenChange(true)}
                    >
                        <Dices className="w-4 h-4" />
                        Roll for Encounter
                    </Button>

                    <Button
                        onClick={() => handleCreateOpenChange(true)}
                        aria-label="Roll for Encounter"
                        size="icon"
                        variant="default"
                        className="sm:hidden fixed bottom-12 right-6 z-50 w-12 h-12 rounded-full p-0 flex items-center justify-center shadow-lg"
                    >
                        <Dices
                            className="!w-7 !h-7"
                            size={36}
                        />
                    </Button>
                </div>

                {!isLoading && (
                    <EncounterGeneratorDialog
                        mode="create"
                        open={createOpen}
                        onOpenChange={handleCreateOpenChange}
                        hideTitleOnMobile={true}
                        addPending={addPending}
                        removePending={removePending}
                    />
                )}

                {!isLoading && editingEncounter && (
                    <EncounterGeneratorDialog
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
                        addPending={addPending}
                        removePending={removePending}
                    />
                )}
            </div>

            <EncounterContent
                onEdit={(e) => openForEdit(e)}
                pendingIds={pendingIds}
            />
        </div>
    );
}
