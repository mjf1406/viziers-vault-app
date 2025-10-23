/** @format */

"use client";

import React, { useState } from "react";
import { id as genId } from "@instantdb/react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Credenza,
    CredenzaBody,
    CredenzaClose,
    CredenzaContent,
    CredenzaFooter,
    CredenzaHeader,
    CredenzaTitle,
} from "@/components/ui/credenza";
import db from "@/lib/db";
import { useUser } from "@/hooks/useUser";
import { toast } from "sonner";
import SeedDefaultsButton from "@/app/(app)/app/magic-shop-generator/_components/SeedDefaultsButton";

type Props = {
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    onCreated?: (worldId: string) => void;
};

export default function CreateWorldResponsiveDialog({
    open,
    defaultOpen,
    onOpenChange,
    onCreated,
}: Props) {
    const { user, plan } = useUser();
    const [openLocal, setOpenLocal] = useState<boolean>(!!defaultOpen);
    const isControlled = typeof open !== "undefined";
    const dialogOpen = isControlled ? open : openLocal;
    const setDialogOpen = (v: boolean) => {
        if (!isControlled) setOpenLocal(v);
        onOpenChange?.(v);
    };

    const [name, setName] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) {
            toast.error("Please enter a world name");
            return;
        }
        if (!user?.id) {
            toast.error("You must be logged in to create worlds");
            return;
        }
        const newId = genId();
        setIsSaving(true);
        try {
            await db.transact(
                db.tx.worlds[newId]
                    .create({
                        name: trimmed,
                        createdAt: new Date(),
                        creatorId: user.id,
                    })
                    .link({ $user: user.id })
            );
            toast.success("World created");
            onCreated?.(newId);
            setDialogOpen(false);
            setName("");
        } catch (err: any) {
            console.error("Create world failed", err);
            toast.error("Create world failed");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Credenza
            open={dialogOpen}
            onOpenChange={setDialogOpen}
        >
            <CredenzaContent className="sm:max-w-md p-5">
                <form
                    onSubmit={handleCreate}
                    className="space-y-4"
                >
                    <CredenzaHeader>
                        <CredenzaTitle>Create World</CredenzaTitle>
                    </CredenzaHeader>
                    <CredenzaBody className="space-y-4">
                        <div>
                            <Label htmlFor="world-name">Name</Label>
                            <input
                                id="world-name"
                                className="mt-1 w-full rounded border px-3 py-2"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Eberron"
                            />
                        </div>
                        <div className="pt-2">
                            <SeedDefaultsButton />
                        </div>
                    </CredenzaBody>
                    <CredenzaFooter className="flex items-center justify-between gap-3">
                        <CredenzaClose asChild>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={isSaving}
                            >
                                Cancel
                            </Button>
                        </CredenzaClose>
                        <Button
                            type="submit"
                            disabled={isSaving}
                        >
                            Create
                        </Button>
                    </CredenzaFooter>
                </form>
            </CredenzaContent>
        </Credenza>
    );
}
