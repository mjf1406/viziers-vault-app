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
import {
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { id as genId } from "@instantdb/react";
import Link from "next/link";
import usePartyForm from "../hooks/usePartyForm";
import { makeUploadCandidate } from "@/lib/image";
import { buildCreatePartyOps, buildUpdatePartyOps } from "../tx/partyTx";
import IconPicker from "./IconPicker";
import LevelsEditor from "./LevelsEditor";

export default function AddPartyDialog({
    mode,
    initial = null,
    onClose,
    addPending,
    removePending,
}: {
    mode: "create" | "edit";
    initial?: any | null;
    onClose?: () => void;
    addPending: (id: string) => void;
    removePending: (id: string) => void;
}) {
    const { user } = db.useAuth();
    const [isUploading, setIsUploading] = useState(false);

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
            toast.success("Updating party...");

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

                await db.transact(ops);
                toast.success("Party updated");
                clearForm();
                removePending(pid);
                onClose?.();
            } catch (err) {
                removePending(initial.id ?? initial._id ?? initial.partyId);
                toast.error("Update failed");
            } finally {
                setIsUploading(false);
            }
        } else {
            // create
            const newId = genId();
            addPending(newId);
            toast.success("Creating party...");

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

                await db.transact(ops);
                toast.success("Party created");
                clearForm();
                removePending(newId);
                onClose?.();
            } catch (err: any) {
                console.error("db.transact error", err);
                toast.error("Create failed");
                removePending(newId);
            } finally {
                setIsUploading(false);
            }
        }
    };

    return (
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>
                    {mode === "edit" ? "Edit Party" : "Create New Party"}
                </DialogTitle>
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
                            Upload an image to use as the party icon (optional).
                            It will be used in the{" "}
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

                <div className="flex gap-2 pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onClose?.()}
                        className="flex-1"
                    >
                        Cancel
                    </Button>
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
                </div>
            </form>
        </DialogContent>
    );
}
