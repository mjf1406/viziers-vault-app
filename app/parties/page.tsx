/** @format */

// app/parties/page.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import AddPartyDialog from "./components/AddPartyDialog";
import PartiesGrid from "./components/PartiesGrid";

export default function PartiesPage() {
    const [addOpen, setAddOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editingParty, setEditingParty] = useState<any | null>(null);
    const [pendingIds, setPendingIds] = useState<Set<string>>(() => new Set());

    const addPending = (id: string) => setPendingIds((s) => new Set(s).add(id));
    const removePending = (id: string) =>
        setPendingIds((s) => {
            s.delete(id);
            return new Set(s);
        });

    const openForEdit = (party: any) => {
        setEditingParty(party);
        setEditOpen(true);
    };

    return (
        <div className="space-y-6 p-4 xl:p-10">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold flex gap-3 items-center justify-center">
                    <Users />
                    My Parties
                </h1>

                <Dialog
                    open={addOpen}
                    onOpenChange={setAddOpen}
                >
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="w-4 h-4" />
                            Add Party
                        </Button>
                    </DialogTrigger>

                    <AddPartyDialog
                        mode="create"
                        onClose={() => setAddOpen(false)}
                        addPending={addPending}
                        removePending={removePending}
                    />
                </Dialog>

                {/* Edit dialog: opened programmatically from grid */}
                <Dialog
                    open={editOpen}
                    onOpenChange={(v) => setEditOpen(v)}
                >
                    <AddPartyDialog
                        mode="edit"
                        initial={editingParty}
                        onClose={() => {
                            setEditOpen(false);
                            setEditingParty(null);
                        }}
                        addPending={addPending}
                        removePending={removePending}
                    />
                </Dialog>
            </div>

            <PartiesGrid
                onEdit={(p) => openForEdit(p)}
                pendingIds={pendingIds}
            />
        </div>
    );
}
