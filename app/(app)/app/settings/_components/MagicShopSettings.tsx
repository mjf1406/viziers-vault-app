/** @format */

"use client";

import React from "react";
import db from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Field,
    FieldGroup,
    FieldLabel,
    FieldDescription,
} from "@/components/ui/field";
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
import { Check } from "lucide-react";
import { SPELL_SCROLL_PRICES_GP } from "@/lib/5e-data";

type SettingsRow = {
    id?: string;
    slotBeta?: number | null;
    slotScale?: number | null;
    wealthInfluence?: number | null;
    maxPriceChange?: number | null;
    rarityProgressionExponent?: number | null;
    magicRarityBias?: number | null;
    rarityPopulationGating?: "strict" | "soft" | "none" | null;
    basePrices?: Record<string, Record<string, number>> | null;
    rarityThresholds?: Record<string, number> | null;
    spellScrollPrices?: Record<string, number> | null;
};

const DEFAULTS: Required<Omit<SettingsRow, "id">> = {
    slotBeta: 0.5,
    slotScale: 0.08,
    wealthInfluence: 1,
    maxPriceChange: 0.5,
    rarityProgressionExponent: 1,
    magicRarityBias: 2,
    rarityPopulationGating: "strict",
    basePrices: {
        Common: { NONE: 25, MINOR: 50, MAJOR: 75, WONDROUS: 100 },
        Uncommon: { NONE: 110, MINOR: 208, MAJOR: 305, WONDROUS: 500 },
        Rare: { NONE: 510, MINOR: 1633, MAJOR: 2755, WONDROUS: 5000 },
        "Very Rare": {
            NONE: 5100,
            MINOR: 16300,
            MAJOR: 27500,
            WONDROUS: 50000,
        },
        Legendary: {
            NONE: 51000,
            MINOR: 163250,
            MAJOR: 275500,
            WONDROUS: 500000,
        },
    },
    rarityThresholds: {
        Common: 0,
        Uncommon: 500,
        Rare: 2500,
        "Very Rare": 10000,
        Legendary: 100000,
    },
    spellScrollPrices: SPELL_SCROLL_PRICES_GP,
};

export default function MagicShopSettings() {
    const { user } = db.useAuth();
    const { isLoading, error, data } = db.useQuery({ settings: {} });

    const row: SettingsRow | null = React.useMemo(() => {
        const r = (data?.settings?.[0] as any) ?? null;
        if (!r) return null;
        return {
            id: r.id,
            slotBeta: r.slotBeta ?? null,
            slotScale: r.slotScale ?? null,
            wealthInfluence: r.wealthInfluence ?? null,
            maxPriceChange: r.maxPriceChange ?? null,
            rarityProgressionExponent: r.rarityProgressionExponent ?? null,
            magicRarityBias: r.magicRarityBias ?? null,
            rarityPopulationGating: (r.rarityPopulationGating as any) ?? null,
            basePrices: (r.basePrices as any) ?? null,
            rarityThresholds: (r.rarityThresholds as any) ?? null,
            spellScrollPrices: (r.spellScrollPrices as any) ?? null,
        };
    }, [data?.settings]);

    const [form, setForm] = React.useState<SettingsRow>(() => ({
        slotBeta: row?.slotBeta ?? DEFAULTS.slotBeta,
        slotScale: row?.slotScale ?? DEFAULTS.slotScale,
        wealthInfluence: row?.wealthInfluence ?? DEFAULTS.wealthInfluence,
        maxPriceChange: row?.maxPriceChange ?? DEFAULTS.maxPriceChange,
        rarityProgressionExponent:
            row?.rarityProgressionExponent ??
            DEFAULTS.rarityProgressionExponent,
        magicRarityBias: row?.magicRarityBias ?? DEFAULTS.magicRarityBias,
        rarityPopulationGating:
            row?.rarityPopulationGating ?? DEFAULTS.rarityPopulationGating,
        basePrices: row?.basePrices ?? DEFAULTS.basePrices,
        rarityThresholds: row?.rarityThresholds ?? DEFAULTS.rarityThresholds,
        spellScrollPrices: row?.spellScrollPrices ?? DEFAULTS.spellScrollPrices,
    }));
    React.useEffect(() => {
        setForm({
            slotBeta: row?.slotBeta ?? DEFAULTS.slotBeta,
            slotScale: row?.slotScale ?? DEFAULTS.slotScale,
            wealthInfluence: row?.wealthInfluence ?? DEFAULTS.wealthInfluence,
            maxPriceChange: row?.maxPriceChange ?? DEFAULTS.maxPriceChange,
            rarityProgressionExponent:
                row?.rarityProgressionExponent ??
                DEFAULTS.rarityProgressionExponent,
            magicRarityBias: row?.magicRarityBias ?? DEFAULTS.magicRarityBias,
            rarityPopulationGating:
                row?.rarityPopulationGating ?? DEFAULTS.rarityPopulationGating,
            basePrices: row?.basePrices ?? DEFAULTS.basePrices,
            rarityThresholds:
                row?.rarityThresholds ?? DEFAULTS.rarityThresholds,
            spellScrollPrices:
                row?.spellScrollPrices ?? DEFAULTS.spellScrollPrices,
        });
    }, [row?.id]);

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

    const updateField = (key: keyof SettingsRow, value: any) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const save = async () => {
        if (!user?.id) {
            toast.error("You must be signed in to save settings");
            return;
        }
        setIsSaving(true);
        try {
            const payload: any = {
                slotBeta: Number(form.slotBeta) || DEFAULTS.slotBeta,
                slotScale: Number(form.slotScale) || DEFAULTS.slotScale,
                wealthInfluence:
                    Number(form.wealthInfluence) || DEFAULTS.wealthInfluence,
                maxPriceChange:
                    Number(form.maxPriceChange) || DEFAULTS.maxPriceChange,
                rarityProgressionExponent:
                    Number(form.rarityProgressionExponent) ||
                    DEFAULTS.rarityProgressionExponent,
                magicRarityBias:
                    Number(form.magicRarityBias) || DEFAULTS.magicRarityBias,
                rarityPopulationGating:
                    form.rarityPopulationGating ||
                    DEFAULTS.rarityPopulationGating,
                basePrices: (() => {
                    const source = (form.basePrices ??
                        DEFAULTS.basePrices) as Record<
                        string,
                        Record<string, number>
                    >;
                    const result: Record<string, Record<string, number>> = {};
                    Object.entries(source).forEach(([rarity, record]) => {
                        result[rarity] = {} as Record<string, number>;
                        Object.entries(record).forEach(([k, v]) => {
                            const n = Number(v);
                            result[rarity][k] = Number.isFinite(n) ? n : 0;
                        });
                    });
                    return result;
                })(),
                rarityThresholds: (() => {
                    const source = (form.rarityThresholds ??
                        DEFAULTS.rarityThresholds) as Record<string, number>;
                    const result: Record<string, number> = {};
                    Object.entries(source).forEach(([rarity, v]) => {
                        const n = Number(v);
                        result[rarity] = Number.isFinite(n) ? n : 0;
                    });
                    return result;
                })(),
                spellScrollPrices: (() => {
                    const source = (form.spellScrollPrices ??
                        DEFAULTS.spellScrollPrices) as Record<string, number>;
                    const result: Record<string, number> = {};
                    Object.entries(source).forEach(([level, v]) => {
                        const n = Number(v);
                        result[level] = Number.isFinite(n) ? n : 0;
                    });
                    return result;
                })(),
            };

            const ops: any[] = [];
            if ((row?.id ?? null) != null) {
                ops.push(db.tx.settings[row!.id!].update(payload));
            } else {
                ops.push(
                    db.tx.settings[user.id]
                        .create(payload)
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
                <CardTitle>Magic Shop Generator Settings</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field>
                            <FieldLabel>Slot beta</FieldLabel>
                            <Input
                                type="number"
                                step="0.01"
                                value={form.slotBeta ?? ""}
                                onChange={(e) =>
                                    updateField(
                                        "slotBeta",
                                        parseFloat(e.target.value)
                                    )
                                }
                            />
                            <FieldDescription>
                                Exponent that controls how shop item slots scale
                                with population. Lower values grow more slowly;
                                higher values grow faster. Typical range:
                                0.3–0.8.
                            </FieldDescription>
                        </Field>
                        <Field>
                            <FieldLabel>Slot scale</FieldLabel>
                            <Input
                                type="number"
                                step="0.001"
                                value={form.slotScale ?? ""}
                                onChange={(e) =>
                                    updateField(
                                        "slotScale",
                                        parseFloat(e.target.value)
                                    )
                                }
                            />
                            <FieldDescription>
                                Baseline multiplier for the number of items
                                available. Higher values produce more items
                                across the board.
                            </FieldDescription>
                        </Field>
                        <Field>
                            <FieldLabel>Wealth influence</FieldLabel>
                            <Input
                                type="number"
                                step="0.1"
                                value={form.wealthInfluence ?? ""}
                                onChange={(e) =>
                                    updateField(
                                        "wealthInfluence",
                                        parseFloat(e.target.value)
                                    )
                                }
                            />
                            <FieldDescription>
                                How strongly settlement wealth affects prices. 0
                                disables the effect; 1 is the default strength.
                            </FieldDescription>
                        </Field>
                        <Field>
                            <FieldLabel>Max price change</FieldLabel>
                            <Input
                                type="number"
                                step="0.1"
                                value={form.maxPriceChange ?? ""}
                                onChange={(e) =>
                                    updateField(
                                        "maxPriceChange",
                                        parseFloat(e.target.value)
                                    )
                                }
                            />
                            <FieldDescription>
                                Maximum swing from base prices at the wealth
                                extremes. For example, 0.5 allows prices to vary
                                up to ±50%.
                            </FieldDescription>
                        </Field>
                        <Field>
                            <FieldLabel>Rarity progression exponent</FieldLabel>
                            <Input
                                type="number"
                                step="0.1"
                                value={form.rarityProgressionExponent ?? ""}
                                onChange={(e) =>
                                    updateField(
                                        "rarityProgressionExponent",
                                        parseFloat(e.target.value)
                                    )
                                }
                            />
                            <FieldDescription>
                                Shapes price gaps between rarities. Values &lt;
                                1 compress differences; 1 keeps them linear;
                                &gt; 1 amplifies the gaps.
                            </FieldDescription>
                        </Field>
                        <Field>
                            <FieldLabel>Magic rarity bias</FieldLabel>
                            <Input
                                type="number"
                                step="0.1"
                                value={form.magicRarityBias ?? ""}
                                onChange={(e) =>
                                    updateField(
                                        "magicRarityBias",
                                        parseFloat(e.target.value)
                                    )
                                }
                            />
                            <FieldDescription>
                                Bias toward rarer items as the world’s magicness
                                increases. Higher values shift the distribution
                                more aggressively to rare tiers.
                            </FieldDescription>
                        </Field>
                        <Field>
                            <FieldLabel>Rarity gating</FieldLabel>
                            <Select
                                value={form.rarityPopulationGating ?? "strict"}
                                onValueChange={(v) =>
                                    updateField(
                                        "rarityPopulationGating",
                                        v as SettingsRow["rarityPopulationGating"]
                                    )
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select gating" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="strict">
                                        Strict
                                    </SelectItem>
                                    <SelectItem value="soft">Soft</SelectItem>
                                    <SelectItem value="none">None</SelectItem>
                                </SelectContent>
                            </Select>
                            <FieldDescription>
                                Controls whether population limits can block
                                high-rarity items. Strict: hard cutoffs below
                                thresholds. Soft: heavily penalized but still
                                possible. None: no population-based gating.
                            </FieldDescription>
                        </Field>
                    </FieldGroup>

                    <div className="space-y-4">
                        <div className="text-lg font-medium">
                            Base Prices (gold pieces)
                        </div>
                        <FieldDescription>
                            Base prices by rarity and item category. These are
                            used before applying wealth and rarity modifiers.
                        </FieldDescription>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left">
                                        <th className="py-2 pr-3">Rarity</th>
                                        <th className="py-2 pr-3">None</th>
                                        <th className="py-2 pr-3">Minor</th>
                                        <th className="py-2 pr-3">Major</th>
                                        <th className="py-2 pr-3">Wondrous</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        "Common",
                                        "Uncommon",
                                        "Rare",
                                        "Very Rare",
                                        "Legendary",
                                    ].map((rarity) => (
                                        <tr
                                            key={rarity}
                                            className="border-t"
                                        >
                                            <td className="py-2 pr-3">
                                                {rarity}
                                            </td>
                                            {[
                                                "NONE",
                                                "MINOR",
                                                "MAJOR",
                                                "WONDROUS",
                                            ].map((cat) => (
                                                <td
                                                    key={cat}
                                                    className="py-2 pr-3"
                                                >
                                                    <Input
                                                        type="number"
                                                        step="1"
                                                        value={
                                                            (form.basePrices ??
                                                                DEFAULTS.basePrices)?.[
                                                                rarity
                                                            ]?.[cat] ?? ""
                                                        }
                                                        onChange={(e) => {
                                                            const n =
                                                                parseFloat(
                                                                    e.target
                                                                        .value
                                                                );
                                                            setForm((prev) => {
                                                                const next = {
                                                                    ...prev,
                                                                    basePrices:
                                                                        {
                                                                            ...((prev.basePrices ??
                                                                                DEFAULTS.basePrices) as Record<
                                                                                string,
                                                                                Record<
                                                                                    string,
                                                                                    number
                                                                                >
                                                                            >),
                                                                        },
                                                                } as SettingsRow;
                                                                const safeBase =
                                                                    (next.basePrices ??
                                                                        {}) as Record<
                                                                        string,
                                                                        Record<
                                                                            string,
                                                                            number
                                                                        >
                                                                    >;
                                                                if (
                                                                    !safeBase[
                                                                        rarity
                                                                    ]
                                                                ) {
                                                                    safeBase[
                                                                        rarity
                                                                    ] =
                                                                        {} as Record<
                                                                            string,
                                                                            number
                                                                        >;
                                                                }
                                                                safeBase[
                                                                    rarity
                                                                ][cat] =
                                                                    Number.isFinite(
                                                                        n
                                                                    )
                                                                        ? n
                                                                        : 0;
                                                                next.basePrices =
                                                                    safeBase;
                                                                return next;
                                                            });
                                                        }}
                                                    />
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="text-lg font-medium">
                            Rarity Thresholds (population)
                        </div>
                        <FieldDescription>
                            Minimum population required for each rarity when
                            gating is Strict. Soft gating scales from these
                            thresholds.
                        </FieldDescription>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left">
                                        <th className="py-2 pr-3">Rarity</th>
                                        <th className="py-2 pr-3">
                                            Population
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        "Common",
                                        "Uncommon",
                                        "Rare",
                                        "Very Rare",
                                        "Legendary",
                                    ].map((rarity) => (
                                        <tr
                                            key={rarity}
                                            className="border-t"
                                        >
                                            <td className="py-2 pr-3">
                                                {rarity}
                                            </td>
                                            <td className="py-2 pr-3">
                                                <Input
                                                    type="number"
                                                    step="1"
                                                    value={
                                                        (form.rarityThresholds ??
                                                            DEFAULTS.rarityThresholds)?.[
                                                            rarity
                                                        ] ?? ""
                                                    }
                                                    onChange={(e) => {
                                                        const n = parseFloat(
                                                            e.target.value
                                                        );
                                                        setForm((prev) => {
                                                            const next = {
                                                                ...prev,
                                                                rarityThresholds:
                                                                    {
                                                                        ...(prev.rarityThresholds ??
                                                                            DEFAULTS.rarityThresholds),
                                                                    } as Record<
                                                                        string,
                                                                        number
                                                                    >,
                                                            } as SettingsRow;
                                                            (
                                                                next.rarityThresholds as any
                                                            )[rarity] =
                                                                Number.isFinite(
                                                                    n
                                                                )
                                                                    ? n
                                                                    : 0;
                                                            return next;
                                                        });
                                                    }}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="text-lg font-medium">
                            Spell Scroll Prices (gp)
                        </div>
                        <FieldDescription>
                            Set the base gold cost for spell scrolls by level.
                        </FieldDescription>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left">
                                        <th className="py-2 pr-3">Level</th>
                                        <th className="py-2 pr-3">
                                            Price (gp)
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        "cantrip",
                                        "1",
                                        "2",
                                        "3",
                                        "4",
                                        "5",
                                        "6",
                                        "7",
                                        "8",
                                        "9",
                                    ].map((lvl) => (
                                        <tr
                                            key={lvl}
                                            className="border-t"
                                        >
                                            <td className="py-2 pr-3">{lvl}</td>
                                            <td className="py-2 pr-3">
                                                <Input
                                                    type="number"
                                                    step="1"
                                                    value={
                                                        (form.spellScrollPrices ??
                                                            DEFAULTS.spellScrollPrices)?.[
                                                            lvl
                                                        ] ?? ""
                                                    }
                                                    onChange={(e) => {
                                                        const n = parseFloat(
                                                            e.target.value
                                                        );
                                                        setForm((prev) => {
                                                            const next = {
                                                                ...prev,
                                                                spellScrollPrices:
                                                                    {
                                                                        ...(prev.spellScrollPrices ??
                                                                            DEFAULTS.spellScrollPrices),
                                                                    } as Record<
                                                                        string,
                                                                        number
                                                                    >,
                                                            } as SettingsRow;
                                                            (
                                                                next.spellScrollPrices as any
                                                            )[lvl] =
                                                                Number.isFinite(
                                                                    n
                                                                )
                                                                    ? n
                                                                    : 0;
                                                            return next;
                                                        });
                                                    }}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button
                            onClick={() => void save()}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                "Saving…"
                            ) : wasSaved ? (
                                <span className="inline-flex items-center gap-2">
                                    <Check className="w-4 h-4 text-green-600" />
                                    Saved
                                </span>
                            ) : (
                                "Save Magic Shop settings"
                            )}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
