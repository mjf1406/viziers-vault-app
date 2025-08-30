/** @format */

// app/parties/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Loader2, Plus, Users } from "lucide-react";
import PartiesGrid from "./components/PartiesGrid";
import AddPartyDialogResponsive from "./components/AddPartyResponsiveDialog";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/useUser";
import PartiesUpsell from "@/components/PremiumUpsell";
import { parseAsInteger, useQueryState } from "nuqs";

export default function PartiesPage() {
    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editingParty, setEditingParty] = useState<any | null>(null);
    const [pendingIds, setPendingIds] = useState<Set<string>>(() => new Set());
    const [modalOpen, setModalOpen] = useQueryState(
        "modalOpen",
        parseAsInteger.withDefault(0)
    );
    const { plan, isLoading, user } = useUser();

    // Sync modalOpen query param with createOpen state
    useEffect(() => {
        if (modalOpen === 1 && !createOpen) {
            setCreateOpen(true);
        }
    }, [modalOpen, createOpen]);

    if (isLoading)
        return (
            <div className="p-4 xl:p-10 min-h-dvh flex flex-col items-center justify-center text-center">
                <Loader2
                    className="animate-spin"
                    size={124}
                />
                Loading parties...
            </div>
        );

    const addPending = (id: string) =>
        setPendingIds((s) => {
            const next = new Set(s);
            next.add(id);
            return next;
        });

    const removePending = (id: string) =>
        setPendingIds((s) => {
            const next = new Set(s);
            next.delete(id);
            return next;
        });

    const openForEdit = (party: any) => {
        setEditingParty(party);
        setEditOpen(true);
    };

    const handleCreateOpenChange = (open: boolean) => {
        setCreateOpen(open);
        if (!open && modalOpen === 1) {
            setModalOpen(0);
        }
    };

    return (
        <div className="space-y-6 p-4 xl:p-10 min-h-dvh">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold flex gap-3 items-center justify-center">
                    <Users />
                    My Parties
                </h1>

                {user && plan !== "Free" && (
                    <div className="flex items-center gap-3">
                        {/* Desktop button (visible on sm+) */}
                        <Button
                            className="hidden sm:inline-flex"
                            onClick={() => setCreateOpen(true)}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Party
                        </Button>

                        {/* Mobile FAB (visible only < sm) */}
                        <Button
                            onClick={() => setCreateOpen(true)}
                            aria-label="Add Party"
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
                )}

                {/* Create dialog (controlled) */}
                <AddPartyDialogResponsive
                    mode="create"
                    open={createOpen}
                    onOpenChange={handleCreateOpenChange}
                    hideTitleOnMobile={true}
                    addPending={addPending}
                    removePending={removePending}
                />

                {editingParty && (
                    <AddPartyDialogResponsive
                        key={
                            "responsive-edit-" +
                            (editingParty.id ?? String(Date.now()))
                        }
                        mode="edit"
                        initial={editingParty}
                        open={editOpen}
                        onOpenChange={(v) => {
                            setEditOpen(v);
                            if (!v) setEditingParty(null);
                        }}
                        onClose={() => {
                            setEditOpen(false);
                            setEditingParty(null);
                        }}
                        hideTitleOnMobile={true}
                        addPending={addPending}
                        removePending={removePending}
                    />
                )}
            </div>

            {user && plan !== "Free" ? (
                <PartiesGrid
                    onEdit={(p) => openForEdit(p)}
                    pendingIds={pendingIds}
                />
            ) : (
                <PartiesUpsell unlockedItem="Parties" />
            )}
        </div>
    );
}
