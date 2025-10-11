/** @format */

// components/spellbook-generator/SpellbooksGrid.tsx
"use client";

import React from "react";
// Router not used here
import db from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, BookOpen, Link2 } from "lucide-react";
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
import Link from "next/link";
import { toTitleCase } from "@/lib/utils";
import DownloadSpellbookCSVButton from "./DownloadSpellbookCSVButton";

export default function SpellbooksGrid({
    onEdit,
    pendingIds,
}: {
    onEdit: (s: any) => void;
    pendingIds: Set<string>;
}) {
    const { isLoading, error, data } = db.useQuery({
        spellbooks: {},
    });

    if (isLoading) {
        return <div className="py-12 text-center">Loading spellbooks…</div>;
    }
    if (error) {
        return (
            <div className="py-12 text-center text-destructive">
                Error loading spellbooks
            </div>
        );
    }

    const spellbooksRaw: any[] = data?.spellbooks ?? [];

    const spellbooks = spellbooksRaw
        .map((s) => ({
            ...s,
            createdAt: s.createdAt ?? 0,
            name: s.name ?? "Untitled Spellbook",
            spellCount:
                s.spellCount ?? (Array.isArray(s.spells) ? s.spells.length : 0),
            options: s.options ?? {},
            _raw: s,
        }))
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    const toEditPayload = (r: any) => ({
        id: r.id,
        name: r.name ?? "",
        classes: Array.isArray(r?.options?.classes) ? r.options.classes : [],
        options: {
            ...(r.options ?? {}),
            classes: Array.isArray(r?.options?.classes)
                ? r.options.classes
                : [],
        },
    });

    if (!spellbooks.length) {
        return (
            <div className="py-12 text-center flex flex-col items-center justify-center w-full">
                <div>
                    <BookOpen className="text-muted-foreground w-20 h-20" />
                </div>
                <p className="text-lg text-muted-foreground/70">
                    No spellbooks saved yet
                </p>
                <p className="text-muted-foreground">
                    Generate one to get started
                </p>
            </div>
        );
    }

    const handleDelete = async (id: string) => {
        try {
            await db.transact(tx.spellbooks[id].delete());
            toast.success("Spellbook deleted");
        } catch (err) {
            console.error("Delete spellbook failed:", err);
            toast.error("Delete failed");
        }
    };

    const handleCopyLink = async (id: string) => {
        try {
            const url = `${window.location.origin}/app/spellbook-generator/${id}`;
            await navigator.clipboard.writeText(url);
            toast.success("Link copied to clipboard");
        } catch (err) {
            console.error("Copy link failed:", err);
            toast.error("Failed to copy link");
        }
    };

    return (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {spellbooks.map((s) => {
                const isPending = pendingIds.has(s.id);
                const level = s?.options?.level;
                const schools = s?.options?.schools ?? [];
                const classes = s?.options?.classes ?? [];
                const createdAtLocal = s?.createdAt
                    ? new Date(s.createdAt as any).toLocaleString()
                    : null;
                return (
                    <Card
                        key={s.id}
                        className={`hover:shadow-md transition-shadow ${
                            isPending ? "opacity-70 animate-pulse" : ""
                        }`}
                    >
                        <CardHeader className="relative w-full mx-auto">
                            <div className="flex items-start gap-4">
                                <CardTitle className="flex items-center gap-3 text-lg flex-1 min-w-0">
                                    <Link
                                        href={`/app/spellbook-generator/${s.id}`}
                                        className="text-left hover:underline focus:outline-none focus:ring-2 focus:ring-ring rounded break-words"
                                        title={`Open ${s.name}`}
                                    >
                                        <span className="block">{s.name}</span>
                                    </Link>

                                    {isPending && (
                                        <span className="px-2 py-1 text-xs rounded text-muted-foreground bg-muted whitespace-nowrap">
                                            Saving...
                                        </span>
                                    )}
                                </CardTitle>

                                <div className="flex items-center gap-0.5 shrink-0">
                                    {!isPending && (
                                        <>
                                            <DownloadSpellbookCSVButton
                                                spells={
                                                    Array.isArray(s.spells)
                                                        ? s.spells
                                                        : []
                                                }
                                                spellbookName={
                                                    s.name ?? "Spellbook"
                                                }
                                                variant="ghost"
                                                size="sm"
                                                className="w-8 h-8 p-0 hover:bg-gray-100"
                                                labelSrOnly
                                                title="Download CSV"
                                            />

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    void handleCopyLink(s.id)
                                                }
                                                className="w-8 h-8 p-0 hover:bg-gray-100"
                                                title="Copy link"
                                            >
                                                <Link2 className="w-4 h-4" />
                                            </Button>

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    onEdit(s._raw ?? s)
                                                }
                                                className="w-8 h-8 p-0 hover:bg-gray-100"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>

                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        className="w-8 h-8 p-0"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>
                                                            Delete Spellbook
                                                        </AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Are you sure you
                                                            want to delete "
                                                            {s.name}"? This
                                                            cannot be undone.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>
                                                            Cancel
                                                        </AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() =>
                                                                void handleDelete(
                                                                    s.id
                                                                )
                                                            }
                                                            className="bg-red-600 hover:bg-red-700"
                                                        >
                                                            Delete
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </>
                                    )}
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex flex-wrap gap-1">
                                    {typeof level !== "undefined" && (
                                        <Badge
                                            variant="secondary"
                                            className="text-xs"
                                        >
                                            Level{" "}
                                            {Array.isArray(level)
                                                ? level.join(", ")
                                                : String(level)}
                                        </Badge>
                                    )}
                                    {Array.isArray(classes) &&
                                        classes.length > 0 && (
                                            <Badge
                                                variant="secondary"
                                                className="text-xs"
                                            >
                                                {toTitleCase(
                                                    classes.join(", ")
                                                )}
                                            </Badge>
                                        )}
                                </div>

                                <div className="flex flex-wrap gap-1">
                                    {Array.isArray(schools) &&
                                        schools.length > 0 &&
                                        schools
                                            .slice(0, 6)
                                            .map((sc: string) => (
                                                <Badge
                                                    key={sc}
                                                    variant="outline"
                                                    className="text-xs"
                                                >
                                                    {sc}
                                                </Badge>
                                            ))}
                                    {Array.isArray(schools) &&
                                        schools.length > 6 && (
                                            <Badge
                                                variant="outline"
                                                className="text-xs"
                                            >
                                                +{schools.length - 6} more
                                            </Badge>
                                        )}
                                </div>

                                {createdAtLocal && (
                                    <div className="text-xs text-gray-500">
                                        Created: {createdAtLocal}
                                    </div>
                                )}

                                <div className="pt-2 text-xs text-gray-500">
                                    Total Spells: {s.spellCount}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
