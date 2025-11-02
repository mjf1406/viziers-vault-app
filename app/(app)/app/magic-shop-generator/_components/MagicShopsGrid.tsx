/** @format */

"use client";

import React from "react";
import db from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Store, Link2, Check } from "lucide-react";
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
import DownloadMagicShopCSVButton from "./DownloadMagicShopCSVButton";
import { WEALTH_LEVELS, MAGICNESS_LEVELS } from "@/lib/constants/settlements";

export default function MagicShopsGrid({
    onEdit,
    pendingIds,
}: {
    onEdit: (s: any) => void;
    pendingIds: Set<string>;
}) {
    const { isLoading, error, data } = db.useQuery({
        magicShops: {},
    });

    const [copiedId, setCopiedId] = React.useState<string | null>(null);
    const copyTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
        null
    );
    React.useEffect(() => {
        return () => {
            if (copyTimerRef.current) {
                clearTimeout(copyTimerRef.current);
            }
        };
    }, []);

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

    // Resolve world/settlement names for display when not embedded in options
    const worldIds = Array.from(
        new Set(
            shops
                .map((s: any) => (s?.options?.worldId as any) ?? null)
                .filter(Boolean) as string[]
        )
    );
    const settlementIds = Array.from(
        new Set(
            shops
                .map((s: any) => (s?.options?.settlementId as any) ?? null)
                .filter(Boolean) as string[]
        )
    );
    
    // This hook must be called before any early returns
    const { data: worldSettleData } = db.useQuery({
        worlds: { $: { where: { id: { $in: worldIds } } } },
        settlements: { $: { where: { id: { $in: settlementIds } } } },
    });
    
    const worldIdToName = React.useMemo(() => {
        const m = new Map<string, string>();
        const arr = (worldSettleData?.worlds ?? []) as any[];
        for (const w of arr) {
            if (w?.id) m.set(w.id, w.name ?? w.id);
        }
        return m;
    }, [worldSettleData]);
    const settlementIdToName = React.useMemo(() => {
        const m = new Map<string, string>();
        const arr = (worldSettleData?.settlements ?? []) as any[];
        for (const s of arr) {
            if (s?.id) m.set(s.id, s.name ?? s.id);
        }
        return m;
    }, [worldSettleData]);

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
        } catch (err) {
            console.error("Delete shop failed:", err);
            toast.error("Delete failed");
        }
    };

    const handleCopyLink = async (id: string) => {
        try {
            const url = `${window.location.origin}/app/magic-shop-generator/${id}`;
            await navigator.clipboard.writeText(url);
            setCopiedId(id);
            if (copyTimerRef.current) {
                clearTimeout(copyTimerRef.current);
            }
            copyTimerRef.current = setTimeout(() => {
                setCopiedId(null);
            }, 1000);
        } catch (err) {
            console.error("Copy link failed:", err);
            toast.error("Failed to copy link");
        }
    };

    return (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {shops.map((s) => {
                const isPending = pendingIds.has(s.id);
                const opts: any = s?.options ?? {};
                const population =
                    typeof opts?.population === "number"
                        ? opts.population
                        : null;
                const wealthIndex: number | null =
                    typeof opts?.wealthIndex === "number"
                        ? opts.wealthIndex
                        : typeof opts?.wealth === "number"
                        ? Math.round(
                              Math.max(0, Math.min(1, opts.wealth)) *
                                  (WEALTH_LEVELS.length - 1)
                          )
                        : null;
                const magicIndex: number | null =
                    typeof opts?.magicLevelIndex === "number"
                        ? opts.magicLevelIndex
                        : typeof opts?.magicLevel === "number"
                        ? opts.magicLevel
                        : null;
                const wealthLabel =
                    wealthIndex != null
                        ? WEALTH_LEVELS[
                              Math.max(
                                  0,
                                  Math.min(
                                      WEALTH_LEVELS.length - 1,
                                      wealthIndex
                                  )
                              )
                          ]
                        : "—";
                const magicLabel =
                    magicIndex != null
                        ? MAGICNESS_LEVELS[
                              Math.max(
                                  0,
                                  Math.min(
                                      MAGICNESS_LEVELS.length - 1,
                                      magicIndex
                                  )
                              )
                          ]
                        : "—";
                const quantity =
                    typeof opts?.quantity === "number" ? opts.quantity : null;
                const stockMultiplier =
                    typeof opts?.stockMultiplier === "number"
                        ? opts.stockMultiplier
                        : null;
                const worldName: string =
                    opts?.worldName ??
                    worldIdToName.get(opts?.worldId as any) ??
                    "—";
                const settlementName: string =
                    opts?.settlementName ??
                    settlementIdToName.get(opts?.settlementId as any) ??
                    "—";
                const selectedStockTypes: string[] = Array.isArray(
                    opts?.selectedStockTypes
                )
                    ? (opts.selectedStockTypes as string[])
                    : [];
                const expandedStockTypes: string[] = Array.isArray(
                    opts?.stockTypes
                )
                    ? (opts.stockTypes as string[])
                    : [];
                const hasAny = (names: string[]) =>
                    names.some((n) => expandedStockTypes.includes(n));
                const categoriesFromExpanded: string[] = (() => {
                    const cats: string[] = [];
                    if (expandedStockTypes.includes("weapon"))
                        cats.push("weapons");
                    if (expandedStockTypes.includes("armor"))
                        cats.push("armor");
                    if (expandedStockTypes.includes("potion"))
                        cats.push("potions");
                    if (expandedStockTypes.includes("poison"))
                        cats.push("poisons");
                    if (
                        hasAny([
                            "ring",
                            "rod",
                            "staff",
                            "wand",
                            "wondrous item",
                        ])
                    )
                        cats.push("items");
                    if (opts?.includeScrolls) cats.push("scrolls");
                    if (opts?.includeSpellComponents)
                        cats.push("spell components");
                    return Array.from(new Set(cats));
                })();
                const stockCategories: string[] = selectedStockTypes.length
                    ? selectedStockTypes
                    : categoriesFromExpanded;
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
                                            <DownloadMagicShopCSVButton
                                                shops={s}
                                                shopName={s.name}
                                                variant="ghost"
                                                size="sm"
                                                className="w-8 h-8 p-0 hover:bg-gray-100"
                                                aria-label="Download CSV"
                                                labelSrOnly
                                            />
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    void handleCopyLink(s.id)
                                                }
                                                className="w-8 h-8 p-0 hover:bg-gray-100"
                                                title={
                                                    copiedId === s.id
                                                        ? "Copied!"
                                                        : "Copy link"
                                                }
                                            >
                                                {copiedId === s.id ? (
                                                    <Check className="w-4 h-4 text-green-600" />
                                                ) : (
                                                    <Link2 className="w-4 h-4" />
                                                )}
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
                                    <Badge
                                        variant="secondary"
                                        className="text-xs"
                                    >
                                        World: {worldName}
                                    </Badge>
                                    <Badge
                                        variant="secondary"
                                        className="text-xs"
                                    >
                                        Settlement: {settlementName}
                                    </Badge>
                                    <Badge
                                        variant="secondary"
                                        className="text-xs"
                                    >
                                        Population:{" "}
                                        {population != null
                                            ? population.toLocaleString()
                                            : "—"}
                                    </Badge>
                                    <Badge
                                        variant="secondary"
                                        className="text-xs"
                                    >
                                        Wealth: {wealthLabel}
                                    </Badge>
                                    <Badge
                                        variant="secondary"
                                        className="text-xs"
                                    >
                                        Magicness: {magicLabel}
                                    </Badge>
                                    <Badge
                                        variant="secondary"
                                        className="text-xs"
                                    >
                                        Qty: {quantity != null ? quantity : "—"}
                                    </Badge>
                                    <Badge
                                        variant="secondary"
                                        className="text-xs"
                                    >
                                        Stock x
                                        {stockMultiplier != null
                                            ? stockMultiplier
                                            : "—"}
                                    </Badge>
                                    <Badge
                                        variant="secondary"
                                        className="text-xs"
                                    >
                                        Types:{" "}
                                        {stockCategories.length
                                            ? stockCategories.join(", ")
                                            : "—"}
                                    </Badge>
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
