/** @format */

"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dices, Globe2, Loader2, Plus } from "lucide-react";
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
import { tx } from "@instantdb/react";
import { toast } from "sonner";

type CreateWorldDialogProps = {
    open: boolean;
    onOpenChange: (v: boolean) => void;
};

export default function CreateWorldDialog({
    open,
    onOpenChange,
}: CreateWorldDialogProps) {
    const [name, setName] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error("Please enter a world name");
            return;
        }

        setIsSubmitting(true);
        try {
            await db.transact(
                tx.worlds[tx.id()].update({
                    name: name.trim(),
                    createdAt: new Date(),
                })
            );
            toast.success("World created");
            setName("");
            onOpenChange(false);
        } catch (err) {
            console.error("Create world failed", err);
            toast.error("Failed to create world");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Credenza
            open={open}
            onOpenChange={onOpenChange}
        >
            <CredenzaContent className="sm:max-w-md p-5">
                <form
                    onSubmit={handleSubmit}
                    className="space-y-4"
                >
                    <CredenzaHeader>
                        <CredenzaTitle>Create World</CredenzaTitle>
                    </CredenzaHeader>
                    <CredenzaBody className="space-y-5">
                        <div>
                            <Label htmlFor="worldName">Name</Label>
                            <Input
                                id="worldName"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Toril"
                            />
                        </div>
                    </CredenzaBody>
                    <CredenzaFooter className="flex items-center justify-between gap-3">
                        <CredenzaClose asChild>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                        </CredenzaClose>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Plus className="mr-2 h-4 w-4" /> Create
                                </>
                            )}
                        </Button>
                    </CredenzaFooter>
                </form>
            </CredenzaContent>
        </Credenza>
    );
}
