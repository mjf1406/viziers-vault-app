/** @format */

"use client";

import React, { useMemo } from "react";
import db from "@/lib/db";
import { PREMADE_WORLDS } from "@/lib/pre-made-worlds";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectSeparator,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function SettlementSelect({
    worldId,
    value,
    onChange,
    placeholder = "Select a settlement",
}: {
    worldId?: string | null;
    value?: string | null;
    onChange: (id: string | null) => void;
    placeholder?: string;
}) {
    const { isLoading, error, data } = db.useQuery({
        worlds: { settlements: {} },
    });

    const settlements = useMemo(() => {
        const worlds = (data?.worlds ?? []) as any[];

        const dbSettlementsAll = worlds.flatMap(
            (w: any) => (w?.settlements ?? []) as any[]
        );

        const premadeSettlementsAll = PREMADE_WORLDS.flatMap((w) =>
            (w.settlements ?? []).map((s) => ({ ...s, worldId: w.id }))
        );

        if (worldId) {
            const dbWorld = worlds.find((w: any) => w.id === worldId);
            const dbList = ((dbWorld?.settlements ?? []) as any[]).map((s) => ({
                id: s.id,
                name: s.name || "Untitled",
            }));

            const premadeList =
                PREMADE_WORLDS.find((w) => w.id === worldId)?.settlements?.map(
                    (s) => ({
                        id: `${worldId}:${s.name}`,
                        name: s.name,
                    })
                ) ?? [];

            return [...premadeList, ...dbList];
        }

        const mergedAll = [
            ...premadeSettlementsAll.map((s) => ({
                id: `${s.worldId}:${s.name}`,
                name: s.name,
            })),
            ...dbSettlementsAll.map((s: any) => ({
                id: s.id,
                name: s.name || "Untitled",
            })),
        ];

        return mergedAll;
    }, [data, worldId]);

    // Build grouped lists for pre-made vs user-made
    const premadeListAll = useMemo(() => {
        if (worldId) {
            return (
                PREMADE_WORLDS.find((w) => w.id === worldId)?.settlements ?? []
            ).map((s) => ({ id: `${worldId}:${s.name}`, name: s.name }));
        }
        return PREMADE_WORLDS.flatMap((w) =>
            (w.settlements ?? []).map((s) => ({
                id: `${w.id}:${s.name}`,
                name: s.name,
            }))
        );
    }, [worldId]);

    const dbListAll = useMemo(() => {
        const worlds = (data?.worlds ?? []) as any[];
        if (worldId) {
            const w = worlds.find((w: any) => w.id === worldId);
            return ((w?.settlements ?? []) as any[]).map((s) => ({
                id: s.id,
                name: s.name || "Untitled",
            }));
        }
        const all = worlds.flatMap((w: any) => (w?.settlements ?? []) as any[]);
        return all.map((s: any) => ({ id: s.id, name: s.name || "Untitled" }));
    }, [data, worldId]);

    return (
        <Select
            value={value ?? undefined}
            onValueChange={(v) => onChange(v === "__none__" ? null : v)}
        >
            <SelectTrigger>
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                {premadeListAll.length ? (
                    <SelectGroup>
                        <SelectLabel>Pre-made settlements</SelectLabel>
                        {premadeListAll.map((s) => (
                            <SelectItem
                                key={`premade-${s.id}`}
                                value={s.id}
                            >
                                {s.name}
                            </SelectItem>
                        ))}
                    </SelectGroup>
                ) : null}
                {dbListAll.length ? (
                    <>
                        {premadeListAll.length ? <SelectSeparator /> : null}
                        <SelectGroup>
                            <SelectLabel>Your settlements</SelectLabel>
                            {dbListAll.map((s) => (
                                <SelectItem
                                    key={`db-${s.id}`}
                                    value={s.id}
                                >
                                    {s.name}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </>
                ) : null}
            </SelectContent>
        </Select>
    );
}
