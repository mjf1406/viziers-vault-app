/** @format */

// app/parties/page.tsx
"use client";

import { useState, useEffect } from "react";
import { BookOpen, Dices, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/useUser";
import { parseAsInteger, useQueryState } from "nuqs";
import PremiumUpsell from "@/components/PremiumUpsell";
import { id as genId } from "@instantdb/react";
import { toast } from "sonner";
import SpellbookGeneratorDialog, {
    GenerateOpts,
} from "./_components/GenSpellbookResponsiveDialog";

export default function SpellbookPage() {
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

    const openForEdit = (p: any) => {
        setEditingParty(p);
        setEditOpen(true);
    };

    const handleEditOpenChange = (v: boolean) => {
        setEditOpen(v);
        if (!v) setEditingParty(null);
    };

    const handleCreateGenerate = async (opts: GenerateOpts) => {
        if (!user?.id) {
            toast.error("You must be signed in to create a spellbook");
            return;
        }

        const newId = genId();
        addPending(newId);

        try {
            // TODO: replace with your create logic (db.transact / API)
            console.log("Create spellbook", newId, opts);
            // Example: await api.createSpellbook({ id: newId, ownerId: user.id, ...opts })
        } catch (err) {
            console.error("Create failed", err);
            toast.error("Create failed");
        } finally {
            removePending(newId);
            setCreateOpen(false);
            setModalOpen(0);
        }
    };

    const handleEditGenerate = async (opts: GenerateOpts) => {
        const id =
            editingParty?.id ?? editingParty?._id ?? editingParty?.spellbookId;
        if (!id) {
            toast.error("Missing spellbook id for edit");
            setEditOpen(false);
            setEditingParty(null);
            return;
        }

        addPending(id);
        try {
            // TODO: replace with your update logic
            console.log("Update spellbook", id, opts);
            // Example: await api.updateSpellbook(id, opts)
        } catch (err) {
            console.error("Update failed", err);
            toast.error("Update failed");
            setEditOpen(true);
        } finally {
            removePending(id);
            setEditOpen(false);
            setEditingParty(null);
        }
    };

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

    return (
        <div className="space-y-6 p-4 xl:p-10 min-h-dvh">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold flex gap-3 items-center justify-center">
                    <BookOpen />
                    My Spellbooks
                </h1>

                {user && plan !== "Free" && (
                    <div className="flex items-center gap-3">
                        {/* Desktop button (visible on sm+) */}
                        <Button
                            className="hidden sm:inline-flex"
                            onClick={() => handleCreateOpenChange(true)}
                        >
                            <Dices className="w-4 h-4" />
                            Generate Spellbook
                        </Button>

                        {/* Mobile FAB (visible only < sm) */}
                        <Button
                            onClick={() => handleCreateOpenChange(true)}
                            aria-label="Generate Spellbook"
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
                )}

                {/* Create dialog (controlled) */}
                <SpellbookGeneratorDialog
                    mode="create"
                    open={createOpen}
                    onOpenChange={handleCreateOpenChange}
                    hideTitleOnMobile={true}
                    addPending={addPending}
                    removePending={removePending}
                    onGenerate={handleCreateGenerate}
                />

                {/* Edit dialog (conditioned on editingParty) */}
                {editingParty && (
                    <SpellbookGeneratorDialog
                        key={
                            "spellbook-edit-" +
                            (editingParty.id ??
                                editingParty._id ??
                                String(Date.now()))
                        }
                        mode="edit"
                        initial={{
                            id:
                                editingParty.id ??
                                editingParty._id ??
                                editingParty.spellbookId,
                            level: editingParty.level,
                            schools: editingParty.schools,
                            classes: editingParty.classes,
                        }}
                        open={editOpen}
                        onOpenChange={handleEditOpenChange}
                        hideTitleOnMobile={true}
                        addPending={addPending}
                        removePending={removePending}
                        onGenerate={handleEditGenerate}
                    />
                )}
            </div>

            {user && plan !== "Free" ? (
                // <PartiesGrid onEdit={(p) => openForEdit(p)} pendingIds={pendingIds} />
                <div>Blah</div>
            ) : (
                <PremiumUpsell unlockedItem="Spellbooks" />
            )}
        </div>
    );
}
