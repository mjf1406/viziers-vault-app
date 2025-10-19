/** @format */

"use client";

import React from "react";
import db from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Store, Link2 } from "lucide-react";
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
import { useGeneratorData } from "../../../_components/GeneratorDataProvider";

export default function MagicShopsGrid({
    onEdit,
    pendingIds,
}: {
    onEdit: (s: any) => void;
    pendingIds: Set<string>;
}) {
    // Use data from context instead of local query
    const { magicShops: magicShopsQuery } = useGeneratorData();
    const { isLoading, error, data } = magicShopsQuery;

    if (isLoading) {
        return <div className="py-12 text-center">Loading shops…</div>;
    }
    if (error) {
        return (
            <div className="py-12 text-center text-destructive">
                Error loading shops
            </div>
        );
    }

    const shopsRaw: any[] = data?.magicShops ?? [];

    const shops = shopsRaw
        .map((s) => ({
            ...s,
            createdAt: s.createdAt ?? 0,
            name: s.name ?? "Untitled Shop",
            options: s.options ?? {},
            _raw: s,
        }))
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    if (!shops.length) {
        return (
            <div className="py-12 text-center flex flex-col items-center justify-center w-full">
                <div>
                    <Store className="text-muted-foreground w-20 h-20" />
                </div>
                <p className="text-lg text-muted-foreground/70">
                    No shops saved yet
                </p>
                <p className="text-muted-foreground">
                    Generate one to get started
                </p>
            </div>
        );
    }

    const handleDelete = async (id: string) => {
        try {
            await db.transact(tx.magicShops[id].delete());
            toast.success("Shop deleted");
        } catch (err) {
            console.error("Delete shop failed:", err);
            toast.error("Delete failed");
        }
    };

    const handleCopyLink = async (id: string) => {
        try {
            const url = `${window.location.origin}/app/magic-shop-generator/${id}`;
            await navigator.clipboard.writeText(url);
            toast.success("Link copied to clipboard");
        } catch (err) {
            console.error("Copy link failed:", err);
            toast.error("Failed to copy link");
        }
    };

    return (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {shops.map((s) => {
                const isPending = pendingIds.has(s.id);
                const population = s?.options?.population;
                const wealth = s?.options?.wealth;
                const magicLevel = s?.options?.magicLevel;
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
                                        href={`/app/magic-shop-generator/${s.id}`}
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
                                                            Delete Shop
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
                                    {population && (
                                        <Badge
                                            variant="secondary"
                                            className="text-xs"
                                        >
                                            {String(population)}
                                        </Badge>
                                    )}
                                    {wealth && (
                                        <Badge
                                            variant="secondary"
                                            className="text-xs"
                                        >
                                            {String(wealth)}
                                        </Badge>
                                    )}
                                    {magicLevel && (
                                        <Badge
                                            variant="secondary"
                                            className="text-xs"
                                        >
                                            {String(magicLevel)}
                                        </Badge>
                                    )}
                                </div>

                                {createdAtLocal && (
                                    <div className="text-xs text-gray-500">
                                        Created: {createdAtLocal}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
