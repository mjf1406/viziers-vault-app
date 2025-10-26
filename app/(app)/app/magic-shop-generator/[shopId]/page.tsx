/** @format */

"use client";

import React from "react";
import { useParams } from "next/navigation";
import db from "@/lib/db";
import { useUser } from "@/hooks/useUser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buildItemUrl, buildSpellUrl } from "@/lib/urlBuilder";
import DownloadMagicShopCSVButton from "../_components/DownloadMagicShopCSVButton";
import CopyLinkButton from "@/components/CopyLinkButton";
import { WEALTH_LEVELS, MAGICNESS_LEVELS } from "@/lib/constants/settlements";
import {
    FaShirt,
    FaBoxOpen,
    FaSkullCrossbones,
    FaFlask,
    FaWandMagicSparkles,
    FaScroll,
    FaHammer,
} from "react-icons/fa6";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";
import { Store } from "lucide-react";

function rarityNameClass(rarity?: string): string {
    const r = String(rarity || "Common").toLowerCase();
    if (r === "legendary") return "text-orange-800";
    if (r === "very rare") return "text-purple-800";
    if (r === "rare") return "text-indigo-800";
    if (r === "uncommon") return "text-emerald-800";
    return "text-foreground";
}

function typeIcon(type?: string): React.ReactNode {
    const t = String(type || "").toLowerCase();
    if (t === "weapon") return <FaHammer size={18} />; // weapons
    if (t === "armor") return <FaShirt size={18} />; // armor
    if (t === "potion") return <FaFlask size={18} />; // potions
    if (t === "poison") return <FaSkullCrossbones size={18} />; // poisons
    if (t === "scroll") return <FaScroll size={18} />; // scrolls
    if (t === "component") return <FaWandMagicSparkles size={18} />; // spell components
    // default bucket for items (rod, staff, wand, ring, wondrous item, etc.)
    return <FaBoxOpen size={18} />;
}

export default function MagicShopDetailPage() {
    const params = useParams();
    const shopId = (params?.shopId as string) ?? "";
    const { settings } = useUser();

    const { isLoading, error, data } = db.useQuery({
        magicShops: { $: { where: { id: shopId }, limit: 1 } },
        settings: {},
    });

    if (isLoading) return <div className="p-4 xl:p-10">Loading…</div>;
    if (error)
        return (
            <div className="p-4 xl:p-10 text-destructive">Failed to load</div>
        );

    const shop = Array.isArray(data?.magicShops) ? data?.magicShops[0] : null;
    const worldIdForQuery = (shop as any)?.options?.worldId ?? null;
    const settlementIdForQuery = (shop as any)?.options?.settlementId ?? null;
    const worldIds = worldIdForQuery ? [worldIdForQuery] : [];
    const settlementIds = settlementIdForQuery ? [settlementIdForQuery] : [];
    const { data: worldSettleData } = db.useQuery({
        worlds: { $: { where: { id: { $in: worldIds } }, limit: 1 } },
        settlements: {
            $: { where: { id: { $in: settlementIds } }, limit: 1 },
        },
    });
    const urlPrefs =
        (settings as any)?.urlPreferences ??
        (Array.isArray(data?.settings)
            ? data?.settings[0]?.urlPreferences ?? null
            : null);
    const itemPrefs = urlPrefs?.items ?? null;
    const spellPrefs = urlPrefs?.spells ?? null;

    if (!shop) {
        return (
            <div className="p-4 xl:p-10">
                <div className="mt-6">Shop not found.</div>
            </div>
        );
    }

    const items = (shop?.items ?? {}) as any;
    const gear: any[] = Array.isArray(items?.gear) ? items.gear : [];
    const scrolls: any[] = Array.isArray(items?.scrolls) ? items.scrolls : [];
    const components: any[] = Array.isArray(items?.components)
        ? items.components
        : [];

    const allCards = [
        ...gear.map((g) => ({
            kind: "gear" as const,
            id: g.id,
            name: g.name,
            rarity: g.rarity,
            type: g.type,
            priceGp: g.priceGp,
            href: buildItemUrl(g, itemPrefs) ?? g.url ?? null,
        })),
        ...scrolls.map((s) => ({
            kind: "scroll" as const,
            id: s.spellId || s.id,
            name: s.name,
            rarity: s.rarity,
            type: "scroll",
            priceGp: s.priceGp,
            href: buildSpellUrl(s, spellPrefs) ?? s.url ?? null,
        })),
        ...components.map((c) => ({
            kind: "component" as const,
            id: c.spellId || c.id || c.name,
            name: `${c.name} components`,
            rarity: c.rarity || "Common",
            type: "component",
            priceGp: c.priceGp,
            href: buildSpellUrl(c, spellPrefs) ?? c.url ?? null,
        })),
    ];

    return (
        <div className="space-y-6 p-4 xl:p-10">
            <div className="space-y-2">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <Link
                                prefetch={true}
                                href="/app/magic-shop-generator"
                            >
                                Magic Shops
                            </Link>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <span className="text-foreground">
                                {shop.name ?? "Magic Shop"}
                            </span>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold flex gap-3 items-center justify-center">
                        <Store />
                        {shop.name ?? "Magic Shop"}
                    </h1>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <div>
                    Created{" "}
                    {shop.createdAt
                        ? new Date(shop.createdAt as any).toLocaleString()
                        : "—"}
                </div>
                <div className="flex items-center gap-2">
                    <DownloadMagicShopCSVButton
                        shops={shop}
                        shopName={shop.name ?? "Magic Shop"}
                        variant="outline"
                        size="sm"
                        title="Download CSV"
                        label="Download CSV"
                    />
                    <CopyLinkButton
                        variant="outline"
                        size="sm"
                    />
                </div>
            </div>

            {(() => {
                const opts: any = (shop as any)?.options ?? {};
                const worldName: string =
                    opts?.worldName ??
                    ((Array.isArray(worldSettleData?.worlds) &&
                        (worldSettleData as any).worlds[0]?.name) ||
                        "—");
                const settlementName: string =
                    opts?.settlementName ??
                    ((Array.isArray(worldSettleData?.settlements) &&
                        (worldSettleData as any).settlements[0]?.name) ||
                        "—");
                const populationVal: number | null =
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
                const quantity: number | null =
                    typeof opts?.quantity === "number" ? opts.quantity : null;
                const stockMultiplier: number | null =
                    typeof opts?.stockMultiplier === "number"
                        ? opts.stockMultiplier
                        : null;
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
                const categoriesFromExpanded: string[] = (() => {
                    const cats: string[] = [];
                    const hasAny = (names: string[]) =>
                        names.some((n) => expandedStockTypes.includes(n));
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
                return (
                    <div className="flex flex-wrap gap-2">
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
                            {populationVal != null
                                ? populationVal.toLocaleString()
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
                            {stockMultiplier != null ? stockMultiplier : "—"}
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
                );
            })()}

            <Card>
                <CardHeader>
                    <CardTitle>Inventory ({allCards.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {allCards.length === 0 ? (
                        <div className="text-muted-foreground">
                            No items saved
                        </div>
                    ) : (
                        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                            {allCards.map((it) => (
                                <div
                                    key={`${it.kind}:${it.id}:${it.name}`}
                                    className={`border rounded p-3`}
                                >
                                    <div className="flex items-start gap-2">
                                        <span className="mt-0.5 text-muted-foreground">
                                            {typeIcon(it.type)}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <div
                                                className={`font-medium truncate ${rarityNameClass(
                                                    it.rarity
                                                )}`}
                                                title={it.name}
                                            >
                                                {it.name}
                                            </div>
                                            <div className="text-xs text-muted-foreground flex items-center gap-2">
                                                <Badge
                                                    variant="outline"
                                                    className="text-[10px] py-0 px-1"
                                                >
                                                    {it.rarity ?? "Common"}
                                                </Badge>
                                                <span className="whitespace-nowrap">
                                                    {typeof it.priceGp ===
                                                    "number"
                                                        ? `${it.priceGp} gp`
                                                        : "—"}
                                                </span>
                                            </div>
                                            {it.href ? (
                                                <a
                                                    href={it.href}
                                                    target="_blank"
                                                    rel="noreferrer noopener"
                                                    className="text-xs text-primary hover:underline"
                                                >
                                                    Open reference
                                                </a>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
