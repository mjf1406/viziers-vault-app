/** @format */

// app/parties/page.tsx
"use client";

import { useState } from "react";
import { Plus, Users } from "lucide-react";
import AddPartyDialog from "./components/AddPartyDialog";
import PartiesGrid from "./components/PartiesGrid";

export default function PartiesPage() {
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
        <div className="space-y-6 p-4 xl:p-10 min-h-dvh">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold flex gap-3 items-center justify-center">
                    <Users />
                    My Parties
                </h1>

                {/* Create dialog using the new trigger props, hide text on mobile */}
                <AddPartyDialog
                    mode="create"
                    triggerText="Add Party"
                    triggerIcon={<Plus className="w-12 h-12 md:w-4 md:h-4" />}
                    hideTriggerTextOnMobile={true}
                    onClose={() => {}}
                    addPending={addPending}
                    removePending={removePending}
                    fixedTrigger={true}
                />

                {/* Edit dialog: opened programmatically from grid (controlled) */}
                <AddPartyDialog
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
                    addPending={addPending}
                    removePending={removePending}
                />
            </div>

            <PartiesGrid
                onEdit={(p) => openForEdit(p)}
                pendingIds={pendingIds}
            />
        </div>
    );
}
