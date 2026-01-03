/** @format */

"use client";

import React from "react";
import db from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldDescription } from "@/components/ui/field";
import { toast } from "sonner";
import { Check } from "lucide-react";
import {
    ENCOUNTER_PROBABILITIES,
    ROAD_MODIFIERS,
    PACE_MODIFIERS,
    DIFFICULTY_PROBABILITIES,
    BIOMES,
    ROADS,
    TRAVEL_PACES,
    TIMES,
} from "@/app/(app)/app/encounter-generator/_constants/encounters";
import { DIFFICULTY_LEVELS } from "@/components/encounters/DifficultyLevelRadio";

// Types matching the object structure
type EncounterProbabilitiesObject = typeof ENCOUNTER_PROBABILITIES;
type RoadModifiersObject = typeof ROAD_MODIFIERS;
type PaceModifiersObject = typeof PACE_MODIFIERS;
type DifficultyProbabilitiesObject = typeof DIFFICULTY_PROBABILITIES;

type SettingsRow = {
    id?: string;
    encounterProbabilities?: EncounterProbabilitiesObject | null;
    roadModifiers?: RoadModifiersObject | null;
    paceModifiers?: PaceModifiersObject | null;
    difficultyProbabilities?: DifficultyProbabilitiesObject | null;
};

// Use constants as defaults - convert to plain objects to avoid readonly issues
const DEFAULT_ENCOUNTER_PROBABILITIES = JSON.parse(
    JSON.stringify(ENCOUNTER_PROBABILITIES)
);
const DEFAULT_ROAD_MODIFIERS = JSON.parse(JSON.stringify(ROAD_MODIFIERS));
const DEFAULT_PACE_MODIFIERS = JSON.parse(JSON.stringify(PACE_MODIFIERS));
const DEFAULT_DIFFICULTY_PROBABILITIES = JSON.parse(
    JSON.stringify(DIFFICULTY_PROBABILITIES)
);

export default function EncounterSettings() {
    const { user } = db.useAuth();
    const { isLoading, error, data } = db.useQuery({ settings: {} });

    const row: SettingsRow | null = React.useMemo(() => {
        const r = (data?.settings?.[0] as any) ?? null;
        if (!r) return null;
        return {
            id: r.id,
            encounterProbabilities:
                (r.encounterProbabilities as EncounterProbabilitiesObject | null) ??
                null,
            roadModifiers:
                (r.roadModifiers as RoadModifiersObject | null) ?? null,
            paceModifiers:
                (r.paceModifiers as PaceModifiersObject | null) ?? null,
            difficultyProbabilities:
                (r.difficultyProbabilities as DifficultyProbabilitiesObject | null) ??
                null,
        };
    }, [data?.settings]);

    const [form, setForm] = React.useState<SettingsRow>(() => ({
        encounterProbabilities:
            row?.encounterProbabilities ?? DEFAULT_ENCOUNTER_PROBABILITIES,
        roadModifiers: row?.roadModifiers ?? DEFAULT_ROAD_MODIFIERS,
        paceModifiers: row?.paceModifiers ?? DEFAULT_PACE_MODIFIERS,
        difficultyProbabilities:
            row?.difficultyProbabilities ?? DEFAULT_DIFFICULTY_PROBABILITIES,
    }));

    React.useEffect(() => {
        setForm({
            encounterProbabilities:
                row?.encounterProbabilities ?? DEFAULT_ENCOUNTER_PROBABILITIES,
            roadModifiers: row?.roadModifiers ?? DEFAULT_ROAD_MODIFIERS,
            paceModifiers: row?.paceModifiers ?? DEFAULT_PACE_MODIFIERS,
            difficultyProbabilities:
                row?.difficultyProbabilities ??
                DEFAULT_DIFFICULTY_PROBABILITIES,
        });
    }, [row?.id]);

    const [isSaving, setIsSaving] = React.useState(false);
    const [wasSaved, setWasSaved] = React.useState(false);
    const saveTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
        null
    );
    React.useEffect(() => {
        return () => {
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        };
    }, []);

    const save = async () => {
        if (!user?.id) {
            toast.error("You must be signed in to save settings");
            return;
        }
        setIsSaving(true);
        try {
            // Ensure we're sending plain JSON objects by serializing and parsing
            const payload: any = {
                encounterProbabilities: form.encounterProbabilities
                    ? JSON.parse(JSON.stringify(form.encounterProbabilities))
                    : DEFAULT_ENCOUNTER_PROBABILITIES,
                roadModifiers: form.roadModifiers
                    ? JSON.parse(JSON.stringify(form.roadModifiers))
                    : DEFAULT_ROAD_MODIFIERS,
                paceModifiers: form.paceModifiers
                    ? JSON.parse(JSON.stringify(form.paceModifiers))
                    : DEFAULT_PACE_MODIFIERS,
                difficultyProbabilities: form.difficultyProbabilities
                    ? JSON.parse(JSON.stringify(form.difficultyProbabilities))
                    : DEFAULT_DIFFICULTY_PROBABILITIES,
            };

            const ops: any[] = [];
            if ((row?.id ?? null) != null) {
                ops.push(db.tx.settings[row!.id!].update(payload));
            } else {
                ops.push(
                    db.tx.settings[user.id]
                        .create(payload)
                        .link({ owner: user.id })
                );
            }
            await db.transact(ops);
            setWasSaved(true);
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
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
                <CardTitle>Encounter Generator Settings</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {/* Encounter Probabilities Table */}
                    <div className="space-y-4">
                        <div className="text-lg font-medium">
                            Encounter Probabilities
                        </div>
                        <FieldDescription>
                            Base encounter probabilities by biome and time of
                            day. Values are probabilities (0-1) for each
                            encounter type.
                        </FieldDescription>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left">
                                        <th className="py-2 pr-3">Biome</th>
                                        <th className="py-2 pr-3">Time</th>
                                        <th className="py-2 pr-3">
                                            Non-Combat
                                        </th>
                                        <th className="py-2 pr-3">Combat</th>
                                        <th className="py-2 pr-3">Hazard</th>
                                        <th className="py-2 pr-3">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {BIOMES.map((biome) =>
                                        TIMES.map((time) => (
                                            <tr
                                                key={`${biome}-${time}`}
                                                className="border-t"
                                            >
                                                <td className="py-2 pr-3">
                                                    {time === "day" && biome}
                                                </td>
                                                <td className="py-2 pr-3 capitalize">
                                                    {time}
                                                </td>
                                                {[
                                                    "non_combat",
                                                    "combat",
                                                    "hazard",
                                                    "total",
                                                ].map((key) => (
                                                    <td
                                                        key={key}
                                                        className="py-2 pr-3"
                                                    >
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            value={
                                                                (
                                                                    (form.encounterProbabilities ??
                                                                        DEFAULT_ENCOUNTER_PROBABILITIES) as any
                                                                )?.[biome]?.[
                                                                    time
                                                                ]?.[key] ?? ""
                                                            }
                                                            onChange={(e) => {
                                                                const n =
                                                                    parseFloat(
                                                                        e.target
                                                                            .value
                                                                    );
                                                                setForm(
                                                                    (prev) => {
                                                                        const next =
                                                                            {
                                                                                ...prev,
                                                                                encounterProbabilities:
                                                                                    {
                                                                                        ...((prev.encounterProbabilities ??
                                                                                            DEFAULT_ENCOUNTER_PROBABILITIES) as any),
                                                                                    },
                                                                            } as SettingsRow;
                                                                        const safe =
                                                                            (next.encounterProbabilities ??
                                                                                {}) as any;
                                                                        if (
                                                                            !safe[
                                                                                biome
                                                                            ]
                                                                        ) {
                                                                            safe[
                                                                                biome
                                                                            ] =
                                                                                {};
                                                                        }
                                                                        if (
                                                                            !safe[
                                                                                biome
                                                                            ][
                                                                                time
                                                                            ]
                                                                        ) {
                                                                            safe[
                                                                                biome
                                                                            ][
                                                                                time
                                                                            ] =
                                                                                {};
                                                                        }
                                                                        safe[
                                                                            biome
                                                                        ][time][
                                                                            key
                                                                        ] =
                                                                            Number.isFinite(
                                                                                n
                                                                            )
                                                                                ? n
                                                                                : 0;
                                                                        next.encounterProbabilities =
                                                                            safe;
                                                                        return next;
                                                                    }
                                                                );
                                                            }}
                                                        />
                                                    </td>
                                                ))}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Road Modifiers Table */}
                    <div className="space-y-4">
                        <div className="text-lg font-medium">
                            Road Modifiers
                        </div>
                        <FieldDescription>
                            Encounter probability modifiers by road type and
                            time of day. Values are relative modifiers (e.g.,
                            -0.35 means 35% reduction).
                        </FieldDescription>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left">
                                        <th className="py-2 pr-3">Road Type</th>
                                        <th className="py-2 pr-3">Time</th>
                                        <th className="py-2 pr-3">
                                            Non-Combat
                                        </th>
                                        <th className="py-2 pr-3">Combat</th>
                                        <th className="py-2 pr-3">Hazard</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ROADS.map((road) =>
                                        TIMES.map((time) => (
                                            <tr
                                                key={`${road}-${time}`}
                                                className="border-t"
                                            >
                                                <td className="py-2 pr-3 capitalize">
                                                    {time === "day" && road}
                                                </td>
                                                <td className="py-2 pr-3 capitalize">
                                                    {time}
                                                </td>
                                                {[
                                                    "non_combat",
                                                    "combat",
                                                    "hazard",
                                                ].map((key) => (
                                                    <td
                                                        key={key}
                                                        className="py-2 pr-3"
                                                    >
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            value={
                                                                (
                                                                    (form.roadModifiers ??
                                                                        DEFAULT_ROAD_MODIFIERS) as any
                                                                )?.[road]?.[
                                                                    time
                                                                ]?.[key] ?? ""
                                                            }
                                                            onChange={(e) => {
                                                                const n =
                                                                    parseFloat(
                                                                        e.target
                                                                            .value
                                                                    );
                                                                setForm(
                                                                    (prev) => {
                                                                        const next =
                                                                            {
                                                                                ...prev,
                                                                                roadModifiers:
                                                                                    {
                                                                                        ...((prev.roadModifiers ??
                                                                                            DEFAULT_ROAD_MODIFIERS) as any),
                                                                                    },
                                                                            } as SettingsRow;
                                                                        const safe =
                                                                            (next.roadModifiers ??
                                                                                {}) as any;
                                                                        if (
                                                                            !safe[
                                                                                road
                                                                            ]
                                                                        ) {
                                                                            safe[
                                                                                road
                                                                            ] =
                                                                                {};
                                                                        }
                                                                        if (
                                                                            !safe[
                                                                                road
                                                                            ][
                                                                                time
                                                                            ]
                                                                        ) {
                                                                            safe[
                                                                                road
                                                                            ][
                                                                                time
                                                                            ] =
                                                                                {};
                                                                        }
                                                                        safe[
                                                                            road
                                                                        ][time][
                                                                            key
                                                                        ] =
                                                                            Number.isFinite(
                                                                                n
                                                                            )
                                                                                ? n
                                                                                : 0;
                                                                        next.roadModifiers =
                                                                            safe;
                                                                        return next;
                                                                    }
                                                                );
                                                            }}
                                                        />
                                                    </td>
                                                ))}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pace Modifiers Table */}
                    <div className="space-y-4">
                        <div className="text-lg font-medium">
                            Pace Modifiers
                        </div>
                        <FieldDescription>
                            Encounter probability modifiers by travel pace and
                            time of day. Values are relative modifiers.
                        </FieldDescription>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left">
                                        <th className="py-2 pr-3">Pace</th>
                                        <th className="py-2 pr-3">Time</th>
                                        <th className="py-2 pr-3">
                                            Non-Combat
                                        </th>
                                        <th className="py-2 pr-3">Combat</th>
                                        <th className="py-2 pr-3">Hazard</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {TRAVEL_PACES.map((pace) =>
                                        TIMES.map((time) => (
                                            <tr
                                                key={`${pace}-${time}`}
                                                className="border-t"
                                            >
                                                <td className="py-2 pr-3 capitalize">
                                                    {time === "day" && pace}
                                                </td>
                                                <td className="py-2 pr-3 capitalize">
                                                    {time}
                                                </td>
                                                {[
                                                    "non_combat",
                                                    "combat",
                                                    "hazard",
                                                ].map((key) => (
                                                    <td
                                                        key={key}
                                                        className="py-2 pr-3"
                                                    >
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            value={
                                                                (
                                                                    (form.paceModifiers ??
                                                                        DEFAULT_PACE_MODIFIERS) as any
                                                                )?.[pace]?.[
                                                                    time
                                                                ]?.[key] ?? ""
                                                            }
                                                            onChange={(e) => {
                                                                const n =
                                                                    parseFloat(
                                                                        e.target
                                                                            .value
                                                                    );
                                                                setForm(
                                                                    (prev) => {
                                                                        const next =
                                                                            {
                                                                                ...prev,
                                                                                paceModifiers:
                                                                                    {
                                                                                        ...((prev.paceModifiers ??
                                                                                            DEFAULT_PACE_MODIFIERS) as any),
                                                                                    },
                                                                            } as SettingsRow;
                                                                        const safe =
                                                                            (next.paceModifiers ??
                                                                                {}) as any;
                                                                        if (
                                                                            !safe[
                                                                                pace
                                                                            ]
                                                                        ) {
                                                                            safe[
                                                                                pace
                                                                            ] =
                                                                                {};
                                                                        }
                                                                        if (
                                                                            !safe[
                                                                                pace
                                                                            ][
                                                                                time
                                                                            ]
                                                                        ) {
                                                                            safe[
                                                                                pace
                                                                            ][
                                                                                time
                                                                            ] =
                                                                                {};
                                                                        }
                                                                        safe[
                                                                            pace
                                                                        ][time][
                                                                            key
                                                                        ] =
                                                                            Number.isFinite(
                                                                                n
                                                                            )
                                                                                ? n
                                                                                : 0;
                                                                        next.paceModifiers =
                                                                            safe;
                                                                        return next;
                                                                    }
                                                                );
                                                            }}
                                                        />
                                                    </td>
                                                ))}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Difficulty Probabilities Table */}
                    <div className="space-y-4">
                        <div className="text-lg font-medium">
                            Difficulty Probabilities
                        </div>
                        <FieldDescription>
                            Probability distribution for encounter difficulties
                            by time of day. Values should sum to 1.0 for each
                            time period.
                        </FieldDescription>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left">
                                        <th className="py-2 pr-3">
                                            Difficulty
                                        </th>
                                        <th className="py-2 pr-3">Day</th>
                                        <th className="py-2 pr-3">Night</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {DIFFICULTY_LEVELS.map((difficulty) => (
                                        <tr
                                            key={difficulty}
                                            className="border-t"
                                        >
                                            <td className="py-2 pr-3 capitalize">
                                                {difficulty}
                                            </td>
                                            {TIMES.map((time) => (
                                                <td
                                                    key={time}
                                                    className="py-2 pr-3"
                                                >
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        value={
                                                            (
                                                                (form.difficultyProbabilities ??
                                                                    DEFAULT_DIFFICULTY_PROBABILITIES) as any
                                                            )?.[difficulty]?.[
                                                                time
                                                            ] ?? ""
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
                                                                    difficultyProbabilities:
                                                                        {
                                                                            ...((prev.difficultyProbabilities ??
                                                                                DEFAULT_DIFFICULTY_PROBABILITIES) as any),
                                                                        },
                                                                } as SettingsRow;
                                                                const safe =
                                                                    (next.difficultyProbabilities ??
                                                                        {}) as any;
                                                                if (
                                                                    !safe[
                                                                        difficulty
                                                                    ]
                                                                ) {
                                                                    safe[
                                                                        difficulty
                                                                    ] = {};
                                                                }
                                                                safe[
                                                                    difficulty
                                                                ][time] =
                                                                    Number.isFinite(
                                                                        n
                                                                    )
                                                                        ? n
                                                                        : 0;
                                                                next.difficultyProbabilities =
                                                                    safe;
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

                    <div className="flex justify-end">
                        <Button
                            onClick={() => void save()}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                "Saving…"
                            ) : wasSaved ? (
                                <span className="inline-flex items-center gap-2">
                                    <Check className="w-4 h-4 text-current" />
                                    Saved
                                </span>
                            ) : (
                                "Save Encounter settings"
                            )}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
