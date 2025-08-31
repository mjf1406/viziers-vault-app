/** @format */

"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import db from "@/lib/db";
import { uploadImage } from "@/lib/storage";
import { id as genId } from "@instantdb/react";
import Link from "next/link";
import usePartyForm from "../hooks/usePartyForm";
import { makeUploadCandidate } from "@/lib/image";
import { buildCreatePartyOps, buildUpdatePartyOps } from "../tx/partyTx";
import IconPicker from "./IconPicker";
import LevelsEditor from "./LevelsEditor";
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";

type AddPartyDialogProps = {
    mode: "create" | "edit";
    initial?: any | null;
    onClose?: () => void;
    addPending: (id: string) => void;
    removePending: (id: string) => void;

    // New trigger API (both optional)
    triggerText?: string;
    triggerIcon?: React.ReactNode;
    triggerClassName?: string;

    // optional dialog controls (useful if parent wants to control open)
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;

    // responsive dialog options (ignored by this implementation)
    fixedTrigger?: boolean;
    hideTitleOnMobile?: boolean;
    hideTriggerTextOnMobile?: boolean;
};

export default function AddPartyDialog({
    mode,
    initial = null,
    onClose,
    addPending,
    removePending,
    triggerText,
    triggerIcon,
    triggerClassName,
    open,
    defaultOpen,
    onOpenChange,
    // responsive options (kept in signature for compatibility)
    fixedTrigger = false,
    hideTitleOnMobile = false,
    hideTriggerTextOnMobile = false,
}: AddPartyDialogProps) {
    const { user } = db.useAuth();
    const [isUploading, setIsUploading] = useState(false);
    const [openLocal, setOpenLocal] = useState<boolean>(!!defaultOpen);

    const isControlled = typeof open !== "undefined";
    const dialogOpen = isControlled ? open : openLocal;
    const setDialogOpen = (v: boolean) => {
        if (!isControlled) setOpenLocal(v);
        onOpenChange?.(v);
        if (!isControlled && !v) onClose?.();
    };

    const {
        partyName,
        setPartyName,
        levels,
        addLevel,
        updateLevel,
        removeLevel,
        selectedFile,
        previewUrl,
        fileInputRef,
        handleFileSelect,
        removeSelectedIcon,
        originalFileId,
        removedIcon,
        clearForm,
    } = usePartyForm(initial);

    const submit = async (e?: React.FormEvent) => {
        e?.preventDefault();

        if (!partyName.trim()) {
            toast.error("Party name is required");
            return;
        }
        if (!levels.length) {
            toast.error("Add at least one level");
            return;
        }
        const filtered = levels.filter((l) => l.level > 0 && l.quantity > 0);
        if (!filtered.length) {
            toast.error("Add at least one valid level");
            return;
        }

        setIsUploading(true);

        if (mode === "edit" && initial) {
            const pid = initial.id ?? initial._id ?? initial.partyId;
            addPending(pid);

            try {
                let newFileId: string | null = null;

                if (selectedFile) {
                    try {
                        const candidate = await makeUploadCandidate(
                            selectedFile
                        );
                        const safeName = candidate.name.replace(/\s+/g, "-");
                        const path = `parties/${pid}-icon-${Date.now()}-${safeName}`;
                        newFileId = await uploadImage(
                            candidate.blobOrFile,
                            path,
                            candidate.type
                                ? { contentType: candidate.type }
                                : undefined
                        );
                    } catch (err) {
                        toast.error("Icon upload failed");
                        removePending(pid);
                        setIsUploading(false);

                        return;
                    }
                }

                const ops = buildUpdatePartyOps(
                    pid,
                    partyName.trim(),
                    filtered,
                    originalFileId,
                    removedIcon,
                    newFileId
                );

                setDialogOpen(false);
                await db.transact(ops);
                clearForm();
                removePending(pid);
            } catch (err) {
                removePending(initial.id ?? initial._id ?? initial.partyId);
                toast.error("Update failed");
                setDialogOpen(true);
            } finally {
                setIsUploading(false);
            }
        } else {
            // create
            const newId = genId();
            addPending(newId);

            try {
                let newFileId: string | null = null;

                if (selectedFile) {
                    try {
                        const candidate = await makeUploadCandidate(
                            selectedFile
                        );
                        const safeName = candidate.name.replace(/\s+/g, "-");
                        const path = `parties/${newId}-icon-${Date.now()}-${safeName}`;
                        newFileId = await uploadImage(
                            candidate.blobOrFile,
                            path,
                            candidate.type
                                ? { contentType: candidate.type }
                                : undefined
                        );
                    } catch (err) {
                        toast.error("Icon upload failed");
                        removePending(newId);
                        setIsUploading(false);
                        return;
                    }
                }

                if (!user?.id) {
                    toast.error("You must be signed in to create a party");
                    removePending(newId);
                    setIsUploading(false);
                    return;
                }

                const ops = buildCreatePartyOps(
                    newId,
                    user.id,
                    partyName.trim(),
                    filtered,
                    newFileId
                );

                setDialogOpen(false);
                await db.transact(ops);
                clearForm();
                removePending(newId);
            } catch (err: any) {
                console.error("db.transact error", err);
                toast.error("Create failed:", err?.message || err);
                removePending(newId);
                setDialogOpen(true);
            } finally {
                setIsUploading(false);
            }
        }
    };

    const title = mode === "edit" ? "Edit Party" : "Create New Party";

    return (
        <Dialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
        >
            {/* Trigger */}
            <DialogTrigger asChild>
                {triggerText || triggerIcon ? (
                    <Button className={triggerClassName}>
                        {triggerIcon}
                        {triggerText ? (
                            <span className="ml-2">{triggerText}</span>
                        ) : null}
                    </Button>
                ) : (
                    <Button className={triggerClassName}>
                        <Plus className="w-4 h-4 mr-1" />{" "}
                        {mode === "edit" ? "Edit Party" : "New Party"}
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent className="sm:max-w-md p-5">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>

                <form
                    onSubmit={(e) => void submit(e)}
                    className="space-y-4"
                >
                    <div>
                        <Label htmlFor="partyName">Party Name</Label>
                        <Input
                            id="partyName"
                            value={partyName}
                            onChange={(e) => setPartyName(e.target.value)}
                            placeholder="Enter party name"
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <Label>Party Icon</Label>
                            <div className="flex items-center gap-2">
                                <IconPicker
                                    fileInputRef={fileInputRef}
                                    onFileSelect={handleFileSelect}
                                    onRemove={removeSelectedIcon}
                                    previewUrl={previewUrl}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3 py-2">
                            {previewUrl ? (
                                <img
                                    src={previewUrl}
                                    alt="icon preview"
                                    className="w-16 h-16 object-cover border rounded-full"
                                />
                            ) : (
                                <div className="w-16 h-16 bg-gray-100 flex items-center rounded-full justify-center text-gray-400 border">
                                    N/A
                                </div>
                            )}

                            <div className="text-sm text-muted-foreground">
                                Upload an image to use as the party icon
                                (optional). It will be used in the{" "}
                                <Link
                                    href={"/world-generator"}
                                    className="underline"
                                >
                                    World Generator
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <Label>Character Levels</Label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addLevel}
                            >
                                <Plus className="w-4 h-4 mr-1" /> Add Level
                            </Button>
                        </div>

                        <LevelsEditor
                            levels={levels}
                            updateLevel={updateLevel}
                            removeLevel={removeLevel}
                        />

                        {levels.length === 0 && (
                            <p className="py-4 text-sm text-center text-gray-500">
                                No character levels added yet
                            </p>
                        )}
                    </div>

                    <DialogFooter className="flex gap-2 pt-4">
                        <DialogClose asChild>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setDialogOpen(false);
                                }}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                        </DialogClose>

                        <Button
                            type="submit"
                            className="flex-1"
                            disabled={isUploading}
                        >
                            {isUploading
                                ? "Saving..."
                                : mode === "edit"
                                ? "Update Party"
                                : "Create Party"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
