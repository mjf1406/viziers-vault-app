/** @format */

"use client";

import React from "react";
import db from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Swords, Link2, Check } from "lucide-react";
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
import {
    BIOMES,
} from "@/lib/constants/encounters";

export default function EncountersGrid({
    onEdit,
}: {
    onEdit: (e: any) => any;
}) {
    const { isLoading, error, data } = db.useQuery({
        encounters: {},
    });

    const [copiedId, setCopiedId] = React.useState(null);
    const copyTimerRef = React.useRef(null);
    React.useEffect(() => {
        return () => {
            if (copyTimerRef.current) {
                clearTimeout(copyTimerRef.current);
            }
        };
    }, []);

    const encountersRaw = data?.encounters ?? [];

    const encounters = encountersRaw
        .map((e) => ({
            ...e,
            createdAt: e.createdAt ?? 0,
            name: e.name ?? "Untitled Encounter",
            options: e.options ?? {},
            _raw: e,
        }))
        .sort((a, b) => ((b.createdAt as any) || 0) - ((a.createdAt as any) || 0));

    if (isLoading) {
        return <div className="py-12 text-center">Loading encounters…</div>;
    }
    if (error) {
        return (
            <div className="py-12 text-center text-destructive">
                Error loading encounters
            </div>
        );
    }

    if (!encounters.length) {
        return (
            <div className="py-12 text-center flex flex-col items-center justify-center w-full">
                <div>
                    <Swords className="text-muted-foreground w-20 h-20" />
                </div>
                <p className="text-lg text-muted-foreground/70">
                    No encounters saved yet
                </p>
                <p className="text-muted-foreground">
                    Generate one to get started
                </p>
            </div>
        );
    }

    const handleDelete = async (id: any) => {
        try {
            await db.transact(tx.encounters[id].delete());
        } catch (err) {
            console.error("Delete encounter failed:", err);
            toast.error("Delete failed");
        }
    };

    const handleCopyLink = async (id: any) => {
        try {
            const url = `${window.location.origin}/app/encounter-generator/${id}`;
            await navigator.clipboard.writeText(url);
            setCopiedId(id);
            if (copyTimerRef.current) {
                clearTimeout(copyTimerRef.current);
            }
            copyTimerRef.current = setTimeout(() => {
                setCopiedId(null);
            }, 1000) as any;
        } catch (err) {
            console.error("Copy link failed:", err);
            toast.error("Failed to copy link");
        }
    };

    return (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {encounters.map((e) => {
                const opts = e?.options ?? {};
                // Handle both old format (options directly) and new format (options.instances array)
                const instances = Array.isArray(opts?.instances) ? opts.instances : [opts];
                const firstInstance = instances[0] ?? {};
                const biome =
                    (firstInstance?.biome && BIOMES.includes(firstInstance.biome))
                        ? firstInstance.biome
                        : null;
                const travelPace = firstInstance?.travelPace ?? null;
                const road = firstInstance?.road ?? null;
                const travelMedium = firstInstance?.travelMedium ?? null;
                const time = firstInstance?.time ?? null;
                const season = firstInstance?.season ?? null;
                const encounterCount =
                    typeof e?.encounterCount === "number"
                        ? e.encounterCount
                        : Array.isArray(e?.encounters)
                        ? e.encounters.length
                        : null;
                const createdAtLocal = e?.createdAt
                    ? new Date(e.createdAt).toLocaleString()
                    : null;

                return (
                    <Card
                        key={e.id}
                        className="hover:shadow-md transition-shadow"
                    >
                        <CardHeader className="relative w-full mx-auto">
                            <div className="flex items-start gap-4">
                                <CardTitle className="flex items-center gap-3 text-lg flex-1 min-w-0">
                                    <Link
                                        href={`/app/encounter-generator/${e.id}`}
                                        className="text-left hover:underline focus:outline-none focus:ring-2 focus:ring-ring rounded break-words"
                                        title={`Open ${e.name}`}
                                    >
                                        <span className="block">{e.name}</span>
                                    </Link>
                                </CardTitle>

                                <div className="flex items-center gap-0.5 shrink-0">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                            void handleCopyLink(e.id)
                                        }
                                        className="w-8 h-8 p-0 hover:bg-gray-100"
                                        title={
                                            copiedId === e.id
                                                ? "Copied!"
                                                : "Copy link"
                                        }
                                    >
                                        {copiedId === e.id ? (
                                            <Check className="w-4 h-4 text-green-600" />
                                        ) : (
                                            <Link2 className="w-4 h-4" />
                                        )}
                                    </Button>

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                            onEdit(e._raw ?? e)
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
                                                    Delete Encounter
                                                </AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Are you sure you
                                                    want to delete "
                                                    {e.name}"? This
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
                                                            e.id
                                                        )
                                                    }
                                                    className="bg-red-600 hover:bg-red-700"
                                                >
                                                    Delete
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex flex-wrap gap-1">
                                    {biome && (
                                        <Badge
                                            variant="secondary"
                                            className="text-xs"
                                        >
                                            Biome: {biome}
                                        </Badge>
                                    )}
                                    {travelPace && travelPace !== "random" && (
                                        <Badge
                                            variant="secondary"
                                            className="text-xs"
                                        >
                                            Pace: {travelPace}
                                        </Badge>
                                    )}
                                    {road && road !== "random" && (
                                        <Badge
                                            variant="secondary"
                                            className="text-xs"
                                        >
                                            Road: {road}
                                        </Badge>
                                    )}
                                    {travelMedium &&
                                        travelMedium !== "random" && (
                                            <Badge
                                                variant="secondary"
                                                className="text-xs"
                                            >
                                                Medium: {travelMedium}
                                            </Badge>
                                        )}
                                    {time && time !== "random" && (
                                        <Badge
                                            variant="secondary"
                                            className="text-xs"
                                        >
                                            Time: {time}
                                        </Badge>
                                    )}
                                    {season && season !== "random" && (
                                        <Badge
                                            variant="secondary"
                                            className="text-xs"
                                        >
                                            Season: {season}
                                        </Badge>
                                    )}
                                    {encounterCount != null && (
                                        <Badge
                                            variant="secondary"
                                            className="text-xs"
                                        >
                                            Count: {encounterCount}
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

