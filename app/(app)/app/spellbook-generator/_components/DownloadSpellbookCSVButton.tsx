/** @format */

// components/spellbook-generator/DownloadSpellbookCSVButton.tsx
"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toTitleCase } from "../_functions/helpers";

export type DownloadSpellbookCSVButtonProps = Omit<
    React.ComponentProps<typeof Button>,
    "onClick" | "children"
> & {
    spells: any[];
    spellbookName?: string;
    label?: string;
    labelSrOnly?: boolean;
};

export function spellsToCsv(spellsIn: any[]) {
    const headers = ["Name", "Level", "School", "Classes", "Source", "URL"];
    const escape = (v: any) => {
        const s = v == null ? "" : String(v);
        const needsQuotes = /[",\n]/.test(s);
        const escaped = s.replace(/"/g, '""');
        return needsQuotes ? `"${escaped}"` : escaped;
    };
    const rows = spellsIn
        .slice()
        .sort((a, b) => (a.level ?? 0) - (b.level ?? 0))
        .map((sp) => [
            sp.name ?? sp.NAME ?? toTitleCase(sp.slug) ?? "Unknown",
            sp.level ?? "",
            sp.school ?? "",
            Array.isArray(sp.classes) ? sp.classes.join(";") : "",
            sp.source ?? "",
            sp.url ?? sp.LINK ?? "",
        ]);
    const lines = [headers, ...rows]
        .map((r) => r.map(escape).join(","))
        .join("\r\n");
    return lines;
}

export function buildSpellbookFilename(base: string) {
    const stamp = new Date().toISOString().replace(/[:T]/g, "-").slice(0, 16);
    const safe = (base || "Spellbook").trim();
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

export default function DownloadSpellbookCSVButton(
    props: DownloadSpellbookCSVButtonProps
) {
    const {
        spells,
        spellbookName = "Spellbook",
        label = "Download CSV",
        labelSrOnly = false,
        title,
        ...buttonProps
    } = props;

    const onClick = React.useCallback(() => {
        const csv = spellsToCsv(spells ?? []);
        const base = buildSpellbookFilename(spellbookName);
        downloadCsv(csv, base);
    }, [spells, spellbookName]);

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
