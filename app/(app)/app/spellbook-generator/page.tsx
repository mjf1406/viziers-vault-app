/** @format */

// app/parties/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { BookOpen, Dices } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/useUser";
import { parseAsInteger, useQueryState } from "nuqs";
import type { GenerateOpts } from "./_components/GenSpellbookResponsiveDialog";
import { toast } from "sonner";
import SpellbookUpsell from "./_components/SpellbookUpsell";
import SpellbooksGrid from "./_components/SpellbooksGrid";
import SpellbookGeneratorDialog from "./_components/GenSpellbookResponsiveDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

// Separate component for data-dependent content
function SpellbookContent({
    pendingIds,
    onEdit,
}: {
    pendingIds: Set<string>;
    onEdit: (p: any) => void;
}) {
    const { plan, user } = useUser();

    if (!user || plan === "Free") {
        return <SpellbookUpsell />;
    }

    return (
        <SpellbooksGrid
            onEdit={onEdit}
            pendingIds={pendingIds}
        />
    );
}

// Skeleton for the grid while data loads
function SpellbookGridSkeleton() {
    return (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {[...Array(6)].map((_, i) => (
                <Card
                    key={i}
                    className="hover:shadow-md transition-shadow"
                >
                    <CardHeader className="relative w-full mx-auto">
                        <div className="flex items-start gap-4">
                            <Skeleton className="h-6 flex-1" />
                            <div className="flex items-center gap-0.5 shrink-0">
                                <Skeleton className="w-8 h-8 rounded" />
                                <Skeleton className="w-8 h-8 rounded" />
                                <Skeleton className="w-8 h-8 rounded" />
                                <Skeleton className="w-8 h-8 rounded" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex flex-wrap gap-1">
                                <Skeleton className="h-5 w-16 rounded-full" />
                                <Skeleton className="h-5 w-20 rounded-full" />
                            </div>
                            <div className="flex flex-wrap gap-1">
                                <Skeleton className="h-5 w-24 rounded-full" />
                                <Skeleton className="h-5 w-20 rounded-full" />
                                <Skeleton className="h-5 w-28 rounded-full" />
                            </div>
                            <Skeleton className="h-4 w-48" />
                            <div className="pt-2">
                                <Skeleton className="h-4 w-32" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

export default function SpellbookPage() {
    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editingParty, setEditingParty] = useState<any | null>(null);
    const [pendingIds, setPendingIds] = useState<Set<string>>(() => new Set());
    const [modalOpen, setModalOpen] = useQueryState(
        "modalOpen",
        parseAsInteger.withDefault(0)
    );
    const { isLoading } = useUser();

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
        // Prefer raw record if provided by the grid
        const r = p?._raw ?? p ?? {};
        const id = r.id ?? r._id ?? r.spellbookId ?? "";
        const name = r.name ?? "Untitled Spellbook";

        // Level in saved options is a number or "random"; fall back to "random"
        const levelRaw = r.options?.level ?? r.level;
        const level =
            typeof levelRaw === "number" || levelRaw === "random"
                ? levelRaw
                : "random";

        const schoolsRaw = r.options?.schools ?? r.schools ?? [];

        // Only one class is supported; saved as uppercase in options. Normalize to title case.
        const classesRaw = r.options?.classes ?? r.classes ?? [];
        const firstClass = Array.isArray(classesRaw)
            ? classesRaw[0]
            : classesRaw ?? "";
        const classes = typeof firstClass === "string" ? firstClass : "";

        setEditingParty({
            id,
            name,
            level,
            schools: Array.isArray(schoolsRaw) ? schoolsRaw : [],
            classes,
        });
        setEditOpen(true);
    };

    const handleEditOpenChange = (v: boolean) => {
        setEditOpen(v);
        if (!v) setEditingParty(null);
    };

    // Creation now handled by dialog's server action; no-op here

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

    return (
        <div className="space-y-6 p-4 xl:p-10 min-h-dvh">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold flex gap-3 items-center justify-center">
                    <BookOpen />
                    My Spellbooks
                </h1>

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

                {/* Create dialog (controlled) */}
                {!isLoading && (
                    <SpellbookGeneratorDialog
                        mode="create"
                        open={createOpen}
                        onOpenChange={handleCreateOpenChange}
                        hideTitleOnMobile={true}
                        addPending={addPending}
                        removePending={removePending}
                    />
                )}

                {!isLoading && editingParty && (
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
                            name: editingParty.name ?? "",
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

            <Suspense fallback={<SpellbookGridSkeleton />}>
                <SpellbookContent
                    onEdit={(p) => openForEdit(p)}
                    pendingIds={pendingIds}
                />
            </Suspense>
        </div>
    );
}

/** @format */
