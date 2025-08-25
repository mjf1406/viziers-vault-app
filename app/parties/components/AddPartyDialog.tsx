/** @format */

// components/parties/AddPartyDialog.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import db from "@/lib/db";
import { uploadImage } from "@/lib/storage";
import {
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { id, tx } from "@instantdb/react";
import Link from "next/link";

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
    const [partyName, setPartyName] = useState("");
    const [levels, setLevels] = useState<{ level: number; quantity: number }[]>(
        []
    );
    // inside AddPartyDialog component body (top level)
    const { user, isLoading: authLoading } = db.useAuth();

    // file UI state
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // original linked file id (if any) for this party
    const [originalFileId, setOriginalFileId] = useState<string | null>(null);

    // whether the user explicitly removed the icon
    const [removedIcon, setRemovedIcon] = useState(false);

    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (initial) {
            setPartyName(initial.name ?? "");
            const raw = initial.pcs ?? [];
            setLevels(
                Array.isArray(raw)
                    ? raw.map((r: any) => ({
                          level: r.level ?? r.l ?? 1,
                          quantity: r.quantity ?? r.q ?? 1,
                      }))
                    : []
            );

            // Prefer a resolved preview url if parent provided it (e.g. party.$files?.url)
            const resolvedUrl =
                initial.iconUrl ??
                initial.$files?.url ??
                (initial.icon?.startsWith?.("http") ? initial.icon : null);

            setPreviewUrl(resolvedUrl ?? null);

            // If the initial has a linked $files id, use it; otherwise fallback to initial.icon
            const fileId = initial.$files?.id ?? initial.icon ?? null;
            setOriginalFileId(fileId ?? null);
            setRemovedIcon(false);
            setSelectedFile(null);
        } else {
            setPartyName("");
            setLevels([]);
            setSelectedFile(null);
            setPreviewUrl(null);
            setOriginalFileId(null);
            setRemovedIcon(false);
        }

        return () => {
            if (previewUrl && previewUrl.startsWith("blob:")) {
                URL.revokeObjectURL(previewUrl);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initial]);

    const addLevel = () => setLevels((s) => [...s, { level: 1, quantity: 1 }]);
    const removeLevel = (i: number) =>
        setLevels((s) => s.filter((_, idx) => idx !== i));
    const updateLevel = (
        i: number,
        field: "level" | "quantity",
        value: number
    ) =>
        setLevels((s) => {
            const nxt = [...s];
            nxt[i] = { ...nxt[i], [field]: value };
            return nxt;
        });

    const clearForm = () => {
        setPartyName("");
        setLevels([]);
        setSelectedFile(null);
        if (previewUrl && previewUrl.startsWith("blob:")) {
            URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
        setOriginalFileId(null);
        setRemovedIcon(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0] ?? null;
        if (!f) return;
        if (!f.type.startsWith("image/")) {
            toast.error("Please choose an image file");
            return;
        }
        // revoke previous blob preview
        if (previewUrl && previewUrl.startsWith("blob:")) {
            URL.revokeObjectURL(previewUrl);
        }
        setSelectedFile(f);
        setPreviewUrl(URL.createObjectURL(f));
        // selecting a new file means we're replacing the original link
        setRemovedIcon(false);
        setOriginalFileId(null);
    }

    const removeSelectedIcon = () => {
        if (previewUrl && previewUrl.startsWith("blob:")) {
            URL.revokeObjectURL(previewUrl);
        }
        setSelectedFile(null);
        setPreviewUrl(null);
        // mark that user removed the existing icon (on save we'll unlink)
        if (initial && (initial.$files?.id || initial.icon)) {
            setRemovedIcon(true);
        } else {
            setRemovedIcon(false);
        }
        setOriginalFileId(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

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
            const id = initial.id ?? initial._id ?? initial.partyId;
            addPending(id);
            toast.success("Updating party...");

            try {
                // if a new file was selected -> upload and get fileId
                let newFileId: string | null = null;
                if (selectedFile) {
                    try {
                        const safeName = selectedFile.name.replace(/\s+/g, "-");
                        const path = `parties/${id}-icon-${Date.now()}-${safeName}`;
                        newFileId = await uploadImage(selectedFile, path);
                    } catch (err) {
                        toast.error("Icon upload failed");
                        removePending(id);
                        setIsUploading(false);
                        return;
                    }
                }

                // Build atomic transact ops: update, optional unlink, optional link.
                const ops: any[] = [];
                ops.push(
                    tx.parties[id].update({
                        name: partyName.trim(),
                        pcs: filtered,
                    })
                );

                // If user explicitly removed the icon, unlink the old file
                if (removedIcon && originalFileId) {
                    ops.push(tx.parties[id].unlink({ $files: originalFileId }));
                }

                // If we uploaded a new file, link it (unlink old if it differs)
                if (newFileId) {
                    if (originalFileId && originalFileId !== newFileId) {
                        // explicit unlink of previous file first
                        ops.push(
                            tx.parties[id].unlink({ $files: originalFileId })
                        );
                    }
                    ops.push(tx.parties[id].link({ $files: newFileId }));
                }

                await db.transact(ops);
                toast.success("Party updated");
                clearForm();
                removePending(id);
                onClose?.();
            } catch (err) {
                removePending(initial.id ?? initial._id ?? initial.partyId);
                toast.error("Update failed");
                // keep dialog open for retry
            } finally {
                setIsUploading(false);
            }
        } else {
            // create
            const newId = id();
            addPending(newId);
            toast.success("Creating party...");

            try {
                let newFileId: string | null = null;
                if (selectedFile) {
                    try {
                        const safeName = selectedFile.name.replace(/\s+/g, "-");
                        const path = `parties/${newId}-icon-${Date.now()}-${safeName}`;
                        newFileId = await uploadImage(selectedFile, path, {
                            contentType: selectedFile.type,
                        });
                    } catch (err) {
                        toast.error("Icon upload failed");
                        removePending(newId);
                        setIsUploading(false);
                        return;
                    }
                }

                // inside the else (create) branch of submit()
                if (!user?.id) {
                    toast.error("You must be signed in to create a party");
                    removePending(newId);
                    setIsUploading(false);
                    return;
                }

                const ops: any[] = [];
                ops.push(
                    tx.parties[newId].update({
                        name: partyName.trim(),
                        pcs: filtered,
                        createdAt: Date.now(),
                        creatorId: user.id,
                    })
                );

                if (newFileId) {
                    ops.push(tx.parties[newId].link({ $files: newFileId }));
                }

                ops.push(tx.parties[newId].link({ $user: user.id }));

                await db.transact(ops);
                toast.success("Party created");
                clearForm();
                removePending(newId);
                onClose?.();
            } catch (err: any) {
                console.error("db.transact error", err);
                console.error("hint:", err?.hint);
                throw err;
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
                            <label className="inline-flex">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden rounded-full"
                                    onChange={handleFileSelect}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        fileInputRef.current?.click()
                                    }
                                >
                                    <Plus className="w-4 h-4 mr-1" />
                                    Choose Icon
                                </Button>
                            </label>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={removeSelectedIcon}
                                className="text-sm"
                            >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Remove
                            </Button>
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

                    <div className="space-y-2 overflow-y-auto max-h-48">
                        {levels.map((levelData, idx) => (
                            <div
                                key={idx}
                                className="flex items-center gap-2 p-2 border rounded"
                            >
                                <div className="flex-1">
                                    <Label className="text-xs">Level</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={20}
                                        value={levelData.level}
                                        onChange={(e) =>
                                            updateLevel(
                                                idx,
                                                "level",
                                                parseInt(e.target.value, 10) ||
                                                    1
                                            )
                                        }
                                        className="mt-1"
                                    />
                                </div>
                                <div className="flex-1">
                                    <Label className="text-xs">Quantity</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        value={levelData.quantity}
                                        onChange={(e) =>
                                            updateLevel(
                                                idx,
                                                "quantity",
                                                parseInt(e.target.value, 10) ||
                                                    1
                                            )
                                        }
                                        className="mt-1"
                                    />
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeLevel(idx)}
                                    className="mt-5"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                    </div>

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
