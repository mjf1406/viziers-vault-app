/** @format */

"use client";

import { useEffect, useRef, useState } from "react";

export default function usePartyForm(initial: any | null) {
    const [partyName, setPartyName] = useState("");
    const [levels, setLevels] = useState<{ level: number; quantity: number }[]>(
        []
    );

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [originalFileId, setOriginalFileId] = useState<string | null>(null);
    const [removedIcon, setRemovedIcon] = useState(false);
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

            const resolvedUrl =
                initial.iconUrl ??
                initial.$files?.url ??
                (typeof initial.icon === "string" &&
                initial.icon.startsWith?.("http")
                    ? initial.icon
                    : null);

            setPreviewUrl(resolvedUrl ?? null);
            const fileId = initial.$files?.id ?? initial.icon ?? null;
            setOriginalFileId(fileId ?? null);
            setRemovedIcon(false);
            setSelectedFile(null);
        } else {
            clearForm();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initial]);

    useEffect(() => {
        return () => {
            if (previewUrl && previewUrl.startsWith("blob:")) {
                try {
                    URL.revokeObjectURL(previewUrl);
                } catch {
                    // ignore
                }
            }
        };
    }, [previewUrl]);

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
            try {
                URL.revokeObjectURL(previewUrl);
            } catch {
                // noop
            }
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
            // consumer should call toast
            return;
        }
        if (previewUrl && previewUrl.startsWith("blob:")) {
            try {
                URL.revokeObjectURL(previewUrl);
            } catch {
                // noop
            }
        }
        setSelectedFile(f);
        setPreviewUrl(URL.createObjectURL(f));
        setRemovedIcon(false);
        setOriginalFileId(null);
    }

    const removeSelectedIcon = () => {
        if (previewUrl && previewUrl.startsWith("blob:")) {
            try {
                URL.revokeObjectURL(previewUrl);
            } catch {
                // noop
            }
        }
        setSelectedFile(null);
        setPreviewUrl(null);
        if (initial && (initial.$files?.id || initial.icon)) {
            setRemovedIcon(true);
        } else {
            setRemovedIcon(false);
        }
        setOriginalFileId(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return {
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
    };
}

