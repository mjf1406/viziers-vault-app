/** @format */

// app/spellbook-generator/[spellbookId]/page.tsx
"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import db from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Copy } from "lucide-react";
import { toTitleCase } from "../_functions/helpers";

export default function SpellbookDetailPage() {
    const params = useParams();
    const router = useRouter();
    const spellbookId = (params?.spellbookId as string) ?? "";

    const { isLoading, error, data } = db.useQuery({
        spellbooks: { $: { where: { id: spellbookId }, limit: 1 } },
    });

    const [copied, setCopied] = React.useState(false);
    const copyTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
        null
    );

    React.useEffect(() => {
        return () => {
            if (copyTimeoutRef.current) {
                clearTimeout(copyTimeoutRef.current);
            }
        };
    }, []);

    const copyUrlToClipboard = async () => {
        const url = window.location.href;
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(url);
            } else {
                const ta = document.createElement("textarea");
                ta.value = url;
                ta.setAttribute("readonly", "");
                ta.style.position = "absolute";
                ta.style.left = "-9999px";
                document.body.appendChild(ta);
                ta.select();
                document.execCommand("copy");
                document.body.removeChild(ta);
            }
            setCopied(true);
            if (copyTimeoutRef.current) {
                clearTimeout(copyTimeoutRef.current);
            }
            copyTimeoutRef.current = setTimeout(() => {
                setCopied(false);
                copyTimeoutRef.current = null;
            }, 2000);
        } catch (e) {
            console.error("Failed to copy URL", e);
        }
    };

    if (isLoading) {
        return <div className="p-4 xl:p-10">Loading…</div>;
    }
    if (error) {
        return (
            <div className="p-4 xl:p-10 text-destructive">Failed to load</div>
        );
    }

    const s = Array.isArray(data?.spellbooks) ? data?.spellbooks[0] : null;
    if (!s) {
        return (
            <div className="p-4 xl:p-10">
                <div className="mt-6">Spellbook not found.</div>
            </div>
        );
    }

    const level = s?.options?.level;
    const schools: string[] = s?.options?.schools ?? [];
    const classes: string[] = s?.options?.classes ?? [];
    const spells: any[] = Array.isArray(s?.spells) ? s.spells : [];

    const spellsToCsv = (spellsIn: any[]) => {
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
                sp.name ?? sp.NAME ?? sp.slug ?? "Unknown",
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
    };

    const downloadCsv = (csv: string, nameBase: string) => {
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${nameBase}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const buildSpellbookFilename = (base: string) => {
        const stamp = new Date()
            .toISOString()
            .replace(/[:T]/g, "-")
            .slice(0, 16);
        const safe = (base || "Spellbook").trim();
        return `${safe}-${stamp}`;
    };

    return (
        <div className="space-y-6 p-4 xl:p-10 min-h-dvh">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold">
                        {s.name ?? "Spellbook"}
                    </h1>
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            const csv = spellsToCsv(spells);
                            const fileName = buildSpellbookFilename(
                                s.name ?? "Spellbook"
                            );
                            downloadCsv(csv, fileName);
                        }}
                    >
                        <Download className="h-4 w-4" />
                        Download CSV
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={copyUrlToClipboard}
                        aria-label="Copy URL to clipboard"
                    >
                        <Copy className="h-4 w-4" />
                        {copied ? "Copied!" : "Copy URL"}
                    </Button>
                </div>
            </div>
            <div className="space-x-2">
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
                {classes.length > 0 && (
                    <Badge
                        variant="secondary"
                        className="text-xs"
                    >
                        {toTitleCase(classes.join(", "))}
                    </Badge>
                )}
                {schools.slice(0, 6).map((sc) => (
                    <Badge
                        key={sc}
                        variant="outline"
                        className="text-xs"
                    >
                        {sc}
                    </Badge>
                ))}
                {schools.length > 6 && (
                    <Badge
                        variant="outline"
                        className="text-xs"
                    >
                        +{schools.length - 6} more
                    </Badge>
                )}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Spells: {spells.length}</CardTitle>
                </CardHeader>
                <CardContent>
                    {spells.length === 0 ? (
                        <div className="text-muted-foreground">
                            No spells saved
                        </div>
                    ) : (
                        <div className="divide-y">
                            {spells
                                .slice()
                                .sort((a, b) => (a.level ?? 0) - (b.level ?? 0))
                                .map((sp, idx) => (
                                    <div
                                        key={idx}
                                        className="py-2 flex items-start gap-3"
                                    >
                                        <div className="w-10 shrink-0 text-sm text-muted-foreground text-right">
                                            {typeof sp.level === "number"
                                                ? sp.level
                                                : "-"}
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-medium">
                                                {sp.name ??
                                                    sp.NAME ??
                                                    toTitleCase(sp.slug) ??
                                                    "Unknown"}
                                            </div>
                                            {sp.school && (
                                                <div className="text-xs text-muted-foreground">
                                                    {sp.school}
                                                </div>
                                            )}
                                            {sp.url && (
                                                <a
                                                    href={sp.url}
                                                    target="_blank"
                                                    rel="noreferrer noopener"
                                                    className="text-xs text-primary hover:underline"
                                                >
                                                    Open reference
                                                </a>
                                            )}
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
