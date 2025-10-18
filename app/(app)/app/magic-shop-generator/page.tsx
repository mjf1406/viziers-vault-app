/** @format */

"use client";

import { useState, useEffect, Suspense } from "react";
import { Store, Dices } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/useUser";
import { parseAsInteger, useQueryState } from "nuqs";
import type { GenerateMagicShopOpts } from "./_components/GenMagicShopResponsiveDialog";
import { toast } from "sonner";
import MagicShopUpsell from "./_components/MagicShopUpsell";
import MagicShopsGrid from "./_components/MagicShopsGrid";
import MagicShopGeneratorDialog from "./_components/GenMagicShopResponsiveDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

// Separate component for data-dependent content
function MagicShopContent({
    pendingIds,
    onEdit,
}: {
    pendingIds: Set<string>;
    onEdit: (p: any) => void;
}) {
    const { plan, user } = useUser();

    if (!user || plan === "Free") {
        return <MagicShopUpsell />;
    }

    return (
        <MagicShopsGrid
            onEdit={onEdit}
            pendingIds={pendingIds}
        />
    );
}

// Skeleton for the grid while data loads
function MagicShopGridSkeleton() {
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
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex flex-wrap gap-1">
                                <Skeleton className="h-5 w-20 rounded-full" />
                                <Skeleton className="h-5 w-24 rounded-full" />
                                <Skeleton className="h-5 w-28 rounded-full" />
                            </div>
                            <Skeleton className="h-4 w-48" />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

export default function MagicShopGeneratorPage() {
    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editingShop, setEditingShop] = useState<any | null>(null);
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

    const openForEdit = (p: any) => {
        const r = p?._raw ?? p ?? {};
        const id = r.id ?? r._id ?? r.magicShopId ?? "";
        const name = r.name ?? "Untitled Shop";
        const population = r.options?.population ?? "random";
        const wealth = r.options?.wealth ?? "random";
        const magicness = r.options?.magicness ?? "random";

        setEditingShop({
            id,
            name,
            population,
            wealth,
            magicness,
        });
        setEditOpen(true);
    };

    const handleEditOpenChange = (v: boolean) => {
        setEditOpen(v);
        if (!v) setEditingShop(null);
    };

    const handleEditGenerate = async (opts: GenerateMagicShopOpts) => {
        const id =
            editingShop?.id ?? editingShop?._id ?? editingShop?.magicShopId;
        if (!id) {
            toast.error("Missing shop id for edit");
            setEditOpen(false);
            setEditingShop(null);
            return;
        }

        addPending(id);
        try {
            // TODO: replace with your update logic
            console.log("Update magic shop", id, opts);
        } catch (err) {
            console.error("Update failed", err);
            toast.error("Update failed");
            setEditOpen(true);
        } finally {
            removePending(id);
            setEditOpen(false);
            setEditingShop(null);
        }
    };

    return (
        <div className="space-y-6 p-4 xl:p-10 min-h-dvh">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold flex gap-3 items-center justify-center">
                    <Store />
                    My Magic Shops
                </h1>

                <div className="flex items-center gap-3">
                    <Button
                        className="hidden sm:inline-flex"
                        onClick={() => handleCreateOpenChange(true)}
                    >
                        <Dices className="w-4 h-4" />
                        Generate Magic Shop
                    </Button>

                    <Button
                        onClick={() => handleCreateOpenChange(true)}
                        aria-label="Generate Magic Shop"
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
                    <MagicShopGeneratorDialog
                        mode="create"
                        open={createOpen}
                        onOpenChange={handleCreateOpenChange}
                        hideTitleOnMobile={true}
                        addPending={addPending}
                        removePending={removePending}
                    />
                )}

                {!isLoading && editingShop && (
                    <MagicShopGeneratorDialog
                        key={
                            "magic-shop-edit-" +
                            (editingShop.id ??
                                editingShop._id ??
                                String(Date.now()))
                        }
                        mode="edit"
                        initial={{
                            id:
                                editingShop.id ??
                                editingShop._id ??
                                editingShop.magicShopId,
                            name: editingShop.name ?? "",
                            population: editingShop.population,
                            wealth: editingShop.wealth,
                            magicness: editingShop.magicness,
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

            <Suspense fallback={<MagicShopGridSkeleton />}>
                <MagicShopContent
                    onEdit={(p) => openForEdit(p)}
                    pendingIds={pendingIds}
                />
            </Suspense>
        </div>
    );
}

/** @format */
