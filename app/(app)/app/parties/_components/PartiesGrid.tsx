/** @format */

// components/parties/PartiesGrid.tsx
"use client";

import React from "react";
import db from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Users } from "lucide-react";
import {
    AlertDialog,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { tx } from "@instantdb/react";

export default function PartiesGrid({
    onEdit,
    pendingIds,
}: {
    onEdit: (p: any) => void;
    pendingIds: Set<string>;
}) {
    // Query parties; each party contains its own $files object
    const { isLoading, error, data } = db.useQuery({
        parties: { $files: {} },
    });

    if (isLoading) {
        return <div className="py-12 text-center">Loading parties…</div>;
    }
    if (error) {
        return (
            <div className="py-12 text-center text-destructive">
                Error loading parties
            </div>
        );
    }

    const partiesRaw: any[] = data?.parties ?? [];

    const parties = partiesRaw
        .map((p) => {
            // pcs normalization (backwards compat)
            const pcsRaw = p.pcs ?? [];
            const pcs =
                Array.isArray(pcsRaw) && pcsRaw.length
                    ? pcsRaw.map((x: any) => ({
                          level: x.level ?? x.l ?? 1,
                          quantity: x.quantity ?? x.q ?? 1,
                      }))
                    : [];

            // Resolve icon URL from per-party $files only (no top-level fallback)
            let iconUrl: string | null = null;
            const pFiles = p?.["$files"] ?? p?.$files;
            if (pFiles) {
                const fileObj = Array.isArray(pFiles) ? pFiles[0] : pFiles;
                iconUrl = fileObj?.url ?? null;
            } else if (
                typeof p.icon === "string" &&
                p.icon.startsWith("http")
            ) {
                // optional: support direct URL in p.icon
                iconUrl = p.icon;
            }

            return {
                ...p,
                pcs,
                createdAt: p.createdAt ?? 0,
                iconUrl,
            };
        })
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    if (!parties.length) {
        return (
            <div className="py-12 text-center flex flex-col items-center justify-center w-full">
                <div>
                    <Users className="text-muted-foreground w-20 h-20" />
                </div>
                <p className="text-lg text-muted-foreground/70">
                    No parties created yet
                </p>
                <p className="text-muted-foreground">
                    Click "Add Party" to get started
                </p>
            </div>
        );
    }

    const handleDelete = async (id: string) => {
        try {
            const party = parties.find((x) => x.id === id);
            const pFiles = party?.["$files"] ?? party?.$files;
            const fileIds: string[] = [];

            if (pFiles) {
                if (Array.isArray(pFiles)) {
                    for (const f of pFiles) {
                        if (f?.id) fileIds.push(f.id);
                        else if (f?.key) fileIds.push(f.key);
                        else {
                            console.warn(
                                "Unrecognized file object when deleting party:",
                                f
                            );
                        }
                    }
                } else {
                    const f = pFiles;
                    if (f?.id) fileIds.push(f.id);
                    else if (f?.key) fileIds.push(f.key);
                    else
                        console.warn(
                            "Unrecognized file object when deleting party:",
                            f
                        );
                }
            }

            const txOps: any[] = [];

            txOps.push(tx.parties[id].delete());

            for (const fid of fileIds) {
                txOps.push(tx.$files[fid].delete());
            }

            await db.transact(txOps);

            toast.success("Party and associated files deleted");
        } catch (err) {
            console.error("Delete party failed:", err);
            toast.error("Delete failed");
        }
    };

    return (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {parties.map((p) => {
                const isPending = pendingIds.has(p.id);
                return (
                    <Card
                        key={p.id}
                        className={`hover:shadow-md transition-shadow ${
                            isPending ? "opacity-70 animate-pulse" : ""
                        }`}
                    >
                        <CardHeader className="relative">
                            <div className="flex items-start justify-between">
                                <CardTitle className="flex items-center gap-3 pr-8 text-lg">
                                    {p.iconUrl ? (
                                        <img
                                            src={p.iconUrl}
                                            alt={`${p.name} icon`}
                                            className="w-8 h-8 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                                            {p.name?.charAt(0)?.toUpperCase() ??
                                                "P"}
                                        </div>
                                    )}

                                    <span>{p.name}</span>

                                    {isPending && (
                                        <span className="px-2 py-1 text-xs rounded text-muted-foreground bg-muted">
                                            Saving...
                                        </span>
                                    )}
                                </CardTitle>

                                {!isPending && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onEdit(p)}
                                        className="absolute w-8 h-8 p-0 top-4 right-12 hover:bg-gray-100"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                )}

                                {!isPending && (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="absolute w-8 h-8 p-0 top-4 right-4 hover:bg-red-100 hover:text-red-600"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>
                                                    Delete Party
                                                </AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Are you sure you want to
                                                    delete "{p.name}"? This
                                                    cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>
                                                    Cancel
                                                </AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() =>
                                                        void handleDelete(p.id)
                                                    }
                                                    className="bg-red-600 hover:bg-red-700"
                                                >
                                                    Delete
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                )}
                            </div>
                        </CardHeader>

                        <CardContent>
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-gray-600">
                                    Character Levels:
                                </p>
                                <div className="flex flex-wrap gap-1">
                                    {p.pcs
                                        .slice()
                                        .sort(
                                            (a: any, b: any) =>
                                                a.level - b.level
                                        )
                                        .map((lv: any, i: number) => (
                                            <Badge
                                                key={i}
                                                variant="secondary"
                                                className="text-xs"
                                            >
                                                Level {lv.level} × {lv.quantity}
                                            </Badge>
                                        ))}
                                </div>

                                <div className="pt-2 text-xs text-gray-500">
                                    Total Characters:{" "}
                                    {p.pcs.reduce(
                                        (sum: number, l: any) =>
                                            sum + (l.quantity || 0),
                                        0
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
