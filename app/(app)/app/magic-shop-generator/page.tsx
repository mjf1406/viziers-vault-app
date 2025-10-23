/** @format */

"use client";

import { useState, useEffect } from "react";
import { Store, Dices } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/useUser";
import { parseAsInteger, useQueryState } from "nuqs";
import type { GenerateMagicShopOpts } from "./_components/GenMagicShopResponsiveDialog";
import { updateMagicShop } from "./_actions/updateMagicShop";
import { toast } from "sonner";
import MagicShopUpsell from "./_components/MagicShopUpsell";
import MagicShopsGrid from "./_components/MagicShopsGrid";
import MagicShopGeneratorDialog from "./_components/GenMagicShopResponsiveDialog";

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
            await updateMagicShop({
                id,
                options: opts,
                name: editingShop?.name,
            });
            toast.success("Shop updated");
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

            <MagicShopContent
                onEdit={(p) => openForEdit(p)}
                pendingIds={pendingIds}
            />
        </div>
    );
}

/** @format */
