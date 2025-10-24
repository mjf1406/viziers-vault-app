/** @format */

"use client";

import React from "react";
import db from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Check } from "lucide-react";

type ProviderKey = "dndbeyond" | "open5e" | "5eTools" | "custom";

type SectionKey = "spells" | "items" | "monsters";

type UrlPreferences = {
    [K in SectionKey]: {
        provider: ProviderKey;
        // Only used for custom/5eTools-like URLs
        baseUrl?: string | null;
        argPattern?: string | null; // e.g. "${SPELL_NAME}" or "${ITEM_NAME}_${SOURCE_SHORT}"
        spaceReplacement?: string | null; // e.g. "-" or "%20"
        // Preview-only cache
        preview?: string | null;
    };
};

const DEFAULT_PREFS: UrlPreferences = {
    spells: {
        provider: "custom",
        baseUrl: "https://open5e.com/spells/",
        argPattern: "${SPELL_NAME}",
        spaceReplacement: "-",
        preview: null,
    },
    items: {
        provider: "custom",
        baseUrl: "https://open5e.com/magic-items/",
        argPattern: "${ITEM_NAME}",
        spaceReplacement: "-",
        preview: null,
    },
    monsters: {
        provider: "custom",
        baseUrl: "https://open5e.com/monsters/",
        argPattern: "${MONSTER_NAME}",
        spaceReplacement: "-",
        preview: null,
    },
};

function buildPreview(
    section: SectionKey,
    prefs: UrlPreferences
): string | null {
    const p = prefs[section];
    if (!p) return null;

    const sample =
        section === "spells"
            ? {
                  name: "Melf's Acid Arrow",
                  sourceShort: "xphb",
                  slug: "acid-arrow",
              }
            : section === "items"
            ? {
                  name: "Adamantine Armor",
                  sourceShort: "xdmg",
                  slug: "adamantine-armor",
              }
            : {
                  name: "Adult Red Dragon",
                  sourceShort: "mm",
                  slug: "adult-red-dragon",
              };

    switch (p.provider) {
        case "dndbeyond": {
            // Note: Real DDB requires IDs from scraped data; show example format only
            const base =
                section === "spells"
                    ? "https://www.dndbeyond.com/spells/1988-"
                    : section === "items"
                    ? "https://www.dndbeyond.com/magic-items/5370-"
                    : "https://www.dndbeyond.com/monsters/1234-";
            const slug = (
                sample.slug || sample.name.replace(/\s+/g, "-")
            ).toLowerCase();
            return `${base}${slug}`;
        }
        // Removed open5e and 5eTools from provider options
        case "custom": {
            const base = p.baseUrl || "";
            const replace = p.spaceReplacement ?? "-";
            const argPattern =
                p.argPattern ??
                (section === "spells"
                    ? "${SPELL_NAME}"
                    : section === "items"
                    ? "${ITEM_NAME}"
                    : "${MONSTER_NAME}");
            const nameWith = (sample.name || "").split(" ").join(replace);
            const nameWithLower = nameWith.toLowerCase();
            const filled = argPattern
                .replaceAll("${SPELL_NAME}", nameWith)
                .replaceAll("${SPELL_NAME_LOWER}", nameWithLower)
                .replaceAll("${SPELL_NAME_SLUG}", sample.slug || "")
                .replaceAll("${ITEM_NAME}", nameWith)
                .replaceAll("${MONSTER_NAME}", nameWith)
                .replaceAll("${SOURCE_SHORT}", sample.sourceShort || "")
                .replaceAll("${SOURCE}", (sample as any).source || "");
            return `${base}${filled}`;
        }
        default:
            return null;
    }
}

export default function UrlLinkSettings() {
    const { user } = db.useAuth();
    const { isLoading, error, data } = db.useQuery({ settings: {} });

    const row = Array.isArray(data?.settings) ? data?.settings[0] : null;
    const initial: UrlPreferences = React.useMemo(() => {
        const fromDb = (row?.urlPreferences ?? null) as UrlPreferences | null;
        const merged = {
            ...DEFAULT_PREFS,
            ...(fromDb || {}),
        } as UrlPreferences;
        return {
            spells: { ...DEFAULT_PREFS.spells, ...(merged.spells || {}) },
            items: { ...DEFAULT_PREFS.items, ...(merged.items || {}) },
            monsters: { ...DEFAULT_PREFS.monsters, ...(merged.monsters || {}) },
        } satisfies UrlPreferences;
    }, [row?.urlPreferences]);

    const [prefs, setPrefs] = React.useState<UrlPreferences>(initial);
    React.useEffect(() => setPrefs(initial), [initial]);

    const [isSaving, setIsSaving] = React.useState(false);
    const [wasSaved, setWasSaved] = React.useState(false);
    const saveTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
        null
    );
    React.useEffect(() => {
        return () => {
            if (saveTimerRef.current) {
                clearTimeout(saveTimerRef.current);
            }
        };
    }, []);

    const updateSection = (
        section: SectionKey,
        patch: Partial<UrlPreferences[SectionKey]>
    ) => {
        setPrefs((prev) => {
            const next = {
                ...prev,
                [section]: { ...prev[section], ...patch },
            } as UrlPreferences;
            next[section].preview = buildPreview(section, next);
            return next;
        });
    };

    const save = async () => {
        if (!user?.id) {
            toast.error("You must be signed in to save settings");
            return;
        }
        setIsSaving(true);
        try {
            const ops: any[] = [];
            if (row?.id) {
                ops.push(
                    db.tx.settings[row.id].update({ urlPreferences: prefs })
                );
            } else {
                ops.push(
                    db.tx.settings[user.id]
                        .create({ urlPreferences: prefs })
                        .link({ $user: user.id })
                );
            }
            await db.transact(ops);
            setWasSaved(true);
            if (saveTimerRef.current) {
                clearTimeout(saveTimerRef.current);
            }
            saveTimerRef.current = setTimeout(() => setWasSaved(false), 1000);
        } catch (e) {
            console.error(e);
            toast.error("Failed to save settings");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div>Loading settings…</div>;
    if (error)
        return <div className="text-destructive">Failed to load settings</div>;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Reference Link Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2 text-sm text-muted-foreground">
                    <div>
                        Configure how links are generated for spells, magic
                        items, and monsters. Choose a provider or select Custom
                        and set a Base URL, an Argument pattern, and a Space
                        replacement. Per-type examples are provided below.
                    </div>
                </div>
                <Section
                    title="Spells"
                    sectionKey="spells"
                    prefs={prefs}
                    onChange={updateSection}
                />
                <Section
                    title="Magic Items"
                    sectionKey="items"
                    prefs={prefs}
                    onChange={updateSection}
                />
                <Section
                    title="Monsters"
                    sectionKey="monsters"
                    prefs={prefs}
                    onChange={updateSection}
                />

                <div className="pt-2">
                    <Button
                        onClick={() => void save()}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            "Saving..."
                        ) : wasSaved ? (
                            <span className="inline-flex items-center gap-2">
                                <Check className="w-4 h-4 text-green-600" />
                                Saved
                            </span>
                        ) : (
                            "Save preferences"
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

function Section({
    title,
    sectionKey,
    prefs,
    onChange,
}: {
    title: string;
    sectionKey: SectionKey;
    prefs: UrlPreferences;
    onChange: (
        section: SectionKey,
        patch: Partial<UrlPreferences[SectionKey]>
    ) => void;
}) {
    const p = prefs[sectionKey];
    const [examplesOpen, setExamplesOpen] = React.useState(false);

    const providerLabel = (k: ProviderKey) =>
        k === "dndbeyond" ? "D&D Beyond" : "Custom";

    const showCustom = p.provider === "custom";

    return (
        <div className="space-y-3">
            <div className="text-lg font-semibold">{title}</div>
            <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                    <Label>Provider</Label>
                    <Select
                        value={p.provider}
                        onValueChange={(v) =>
                            onChange(sectionKey, { provider: v as ProviderKey })
                        }
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Choose provider" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="dndbeyond">
                                D&amp;D Beyond
                            </SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {showCustom ? (
                    <div className="space-y-1">
                        <Label>Base URL</Label>
                        <Input
                            value={p.baseUrl ?? ""}
                            onChange={(e) =>
                                onChange(sectionKey, {
                                    baseUrl: e.target.value,
                                })
                            }
                            placeholder={
                                sectionKey === "spells"
                                    ? "https://open5e.com/spells/"
                                    : sectionKey === "items"
                                    ? "https://open5e.com/magic-items/"
                                    : "https://5e.tools/bestiary.html#"
                            }
                        />
                    </div>
                ) : null}

                {showCustom ? (
                    <div className="space-y-1">
                        <Label>Argument pattern</Label>
                        <Input
                            value={p.argPattern ?? ""}
                            onChange={(e) =>
                                onChange(sectionKey, {
                                    argPattern: e.target.value,
                                })
                            }
                            placeholder={
                                sectionKey === "spells"
                                    ? "${SPELL_NAME} or ${SPELL_NAME}_${SOURCE_SHORT}"
                                    : sectionKey === "items"
                                    ? "${ITEM_NAME} or ${ITEM_NAME}_${SOURCE_SHORT}"
                                    : "${MONSTER_NAME} or ${MONSTER_NAME}_${SOURCE_SHORT}"
                            }
                        />
                        {sectionKey === "spells" ? (
                            <Collapsible
                                open={examplesOpen}
                                onOpenChange={setExamplesOpen}
                            >
                                <CollapsibleTrigger className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                                    <ChevronUp
                                        className={
                                            "h-3.5 w-3.5 transition-transform " +
                                            (examplesOpen ? "rotate-180" : "")
                                        }
                                    />
                                    {examplesOpen
                                        ? "Hide examples and variables"
                                        : "Show examples and variables"}
                                </CollapsibleTrigger>
                                <CollapsibleContent className="mt-2 overflow-x-auto">
                                    <table className="w-full text-xs border border-border">
                                        <thead className="bg-muted/50">
                                            <tr>
                                                <th className="p-2 text-left">
                                                    Variable
                                                </th>
                                                <th className="p-2 text-left">
                                                    Example
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td className="p-2 font-mono">
                                                    ${"{SPELL_NAME}"}
                                                </td>
                                                <td className="p-2">
                                                    Melf's Acid Arrow
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="p-2 font-mono">
                                                    ${"{SPELL_NAME_LOWER}"}
                                                </td>
                                                <td className="p-2">
                                                    melf's acid arrow
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="p-2 font-mono">
                                                    ${"{SPELL_NAME_SLUG}"}
                                                </td>
                                                <td className="p-2">
                                                    melfs-acid-arrow
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="p-2 font-mono">
                                                    ${"{SOURCE}"}
                                                </td>
                                                <td className="p-2">
                                                    Player's Handbook (2024)
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="p-2 font-mono">
                                                    ${"{SOURCE_SHORT}"}
                                                </td>
                                                <td className="p-2">xphb</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </CollapsibleContent>
                            </Collapsible>
                        ) : null}
                        {sectionKey === "items" ? (
                            <Collapsible
                                open={examplesOpen}
                                onOpenChange={setExamplesOpen}
                            >
                                <CollapsibleTrigger className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                                    <ChevronDown
                                        className={
                                            "h-3.5 w-3.5 transition-transform " +
                                            (examplesOpen ? "rotate-180" : "")
                                        }
                                    />
                                    {examplesOpen
                                        ? "Hide examples and variables"
                                        : "Show examples and variables"}
                                </CollapsibleTrigger>
                                <CollapsibleContent className="mt-2 text-xs text-muted-foreground">
                                    Variables typically include ${"{ITEM_NAME}"}{" "}
                                    and ${"{SOURCE_SHORT}"}.
                                </CollapsibleContent>
                            </Collapsible>
                        ) : null}
                        {sectionKey === "monsters" ? (
                            <Collapsible
                                open={examplesOpen}
                                onOpenChange={setExamplesOpen}
                            >
                                <CollapsibleTrigger className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                                    <ChevronDown
                                        className={
                                            "h-3.5 w-3.5 transition-transform " +
                                            (examplesOpen ? "rotate-180" : "")
                                        }
                                    />
                                    {examplesOpen
                                        ? "Hide examples and variables"
                                        : "Show examples and variables"}
                                </CollapsibleTrigger>
                                <CollapsibleContent className="mt-2 text-xs text-muted-foreground">
                                    Variables typically include $
                                    {"{MONSTER_NAME}"} and ${"{SOURCE_SHORT}"}.
                                </CollapsibleContent>
                            </Collapsible>
                        ) : null}
                    </div>
                ) : null}

                {showCustom ? (
                    <div className="space-y-1">
                        <Label>Replace spaces with</Label>
                        <Input
                            value={p.spaceReplacement ?? ""}
                            onChange={(e) =>
                                onChange(sectionKey, {
                                    spaceReplacement: e.target.value,
                                })
                            }
                            placeholder={p.provider === "5eTools" ? "%20" : "-"}
                        />
                    </div>
                ) : null}
            </div>

            {/* Per-type instructions removed; see card header instructions */}

            <div className="text-xs">
                <span className="text-muted-foreground">Preview:</span>{" "}
                {(() => {
                    const href = buildPreview(sectionKey, prefs);
                    return href ? (
                        <a
                            href={href}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="break-all text-primary hover:underline"
                        >
                            {href}
                        </a>
                    ) : (
                        <span className="break-all">—</span>
                    );
                })()}
            </div>
        </div>
    );
}
