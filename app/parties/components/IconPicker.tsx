/** @format */

"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

export default function IconPicker({
    fileInputRef,
    onFileSelect,
    onRemove,
    previewUrl,
}: {
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemove: () => void;
    previewUrl: string | null;
}) {
    return (
        <>
            <label className="inline-flex">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden rounded-full"
                    onChange={onFileSelect}
                />
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <Plus className="w-4 h-4 mr-1" />
                    Choose Icon
                </Button>
            </label>

            <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onRemove}
                className="text-sm"
            >
                <Trash2 className="w-4 h-4 mr-1" />
                Remove
            </Button>
        </>
    );
}
