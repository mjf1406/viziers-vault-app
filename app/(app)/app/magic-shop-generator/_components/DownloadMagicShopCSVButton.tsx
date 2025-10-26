/** @format */

// app/(app)/app/magic-shop-generator/_components/DownloadMagicShopCSVButton.tsx
"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export type MagicShopRecord = {
    name?: string | null;
    items?: {
        gear?: Array<{
            id?: string;
            name?: string;
            type?: string;
            rarity?: string;
            priceGp?: number;
            url?: string;
            sourceShort?: string;
        }>;
        scrolls?: Array<{
            spellId?: string;
            name?: string;
            level?: number;
            rarity?: string;
            priceGp?: number;
            type?: string;
            url?: string;
        }>;
        components?: Array<{
            name?: string;
            unit?: string;
            priceGp?: number;
        }>;
    } | null;
};

export type DownloadMagicShopCSVButtonProps = Omit<
    React.ComponentProps<typeof Button>,
    "onClick" | "children"
> & {
    shops: MagicShopRecord | MagicShopRecord[];
    shopName?: string;
    label?: string;
    labelSrOnly?: boolean;
};

export function shopsToCsv(
    shopsIn: MagicShopRecord | MagicShopRecord[]
): string {
    const shops = Array.isArray(shopsIn) ? shopsIn : [shopsIn];
    const headers = [
        "SHOP",
        "CATEGORY",
        "NAME",
        "TYPE",
        "RARITY",
        "LEVEL",
        "PRICE_GP",
        "URL",
    ];
    const escape = (v: any) => {
        const s = v == null ? "" : String(v);
        const needsQuotes = /[",\n]/.test(s);
        const escaped = s.replace(/"/g, '""');
        return needsQuotes ? `"${escaped}"` : escaped;
    };

    const rows: any[][] = [];
    for (const shop of shops) {
        const shopName = (shop?.name || "Magic Shop").toString();
        const gear = shop?.items?.gear ?? [];
        const scrolls = shop?.items?.scrolls ?? [];
        const components = shop?.items?.components ?? [];

        for (const it of gear) {
            rows.push([
                shopName,
                "Gear",
                it?.name ?? "",
                it?.type ?? "",
                it?.rarity ?? "",
                "",
                it?.priceGp ?? "",
                it?.url ?? "",
            ]);
        }
        for (const sc of scrolls) {
            rows.push([
                shopName,
                "Scroll",
                sc?.name ?? "",
                sc?.type ?? "scroll",
                sc?.rarity ?? "",
                sc?.level ?? "",
                sc?.priceGp ?? "",
                sc?.url ?? "",
            ]);
        }
        for (const c of components) {
            rows.push([
                shopName,
                "Component",
                c?.name ?? "",
                c?.unit ?? "",
                "",
                "",
                c?.priceGp ?? "",
                "",
            ]);
        }
    }

    const lines = [headers, ...rows]
        .map((r) => r.map(escape).join(","))
        .join("\r\n");
    return lines;
}

export function buildMagicShopFilename(base?: string | null) {
    const stamp = new Date().toISOString().replace(/[:T]/g, "-").slice(0, 16);
    const safe = (base || "Magic-Shop").toString().trim() || "Magic-Shop";
    return `${safe}-${stamp}`;
}

export function downloadCsv(csv: string, nameBase: string) {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${nameBase}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export default function DownloadMagicShopCSVButton(
    props: DownloadMagicShopCSVButtonProps
) {
    const {
        shops,
        shopName = "Magic Shop",
        label = "Download CSV",
        labelSrOnly = false,
        title,
        ...buttonProps
    } = props;

    const onClick = React.useCallback(() => {
        const csv = shopsToCsv(shops);
        const base = buildMagicShopFilename(shopName);
        downloadCsv(csv, base);
    }, [shops, shopName]);

    return (
        <Button
            onClick={onClick}
            aria-label={label}
            title={title ?? label}
            {...buttonProps}
        >
            <Download className="h-4 w-4" />
            {labelSrOnly ? (
                <span className="sr-only">{label}</span>
            ) : (
                <span className="ml-2">{label}</span>
            )}
        </Button>
    );
}
