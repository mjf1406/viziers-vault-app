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
        // Only show settlements when a world is selected
        if (!worldId) {
            return [];
        }

        const worlds = (data?.worlds ?? []) as any[];
        const dbWorld = worlds.find((w: any) => w.id === worldId);
        
        if (!dbWorld) {
            return [];
        }

        const dbList = ((dbWorld?.settlements ?? []) as any[]).map((s) => ({
            id: s.id,
            name: s.name || "Untitled",
        }));

        // Only show premade settlements if the selected world is a premade world in user's DB
        const dbWorldIsPremade = dbWorld?.isPremade === true;
        const premadeList = dbWorldIsPremade
            ? (() => {
                  const premadeWorld = PREMADE_WORLDS.find(
                      (w) => w.name === dbWorld?.name
                  );
                  return (
                      premadeWorld?.settlements?.map((s) => ({
                          id: `${premadeWorld.id}:${s.name}`,
                          name: s.name,
                      })) ?? []
                  );
              })()
            : [];

        return [...premadeList, ...dbList];
    }, [data, worldId]);

    // Build grouped lists for pre-made vs user-made
    const premadeListAll = useMemo(() => {
        // Only show settlements when a world is selected
        if (!worldId) {
            return [];
        }

        const worlds = (data?.worlds ?? []) as any[];
        const dbWorld = worlds.find((w: any) => w.id === worldId);
        const dbWorldIsPremade = dbWorld?.isPremade === true;
        
        if (!dbWorldIsPremade) return [];
        
        const premadeWorld = PREMADE_WORLDS.find(
            (w) => w.name === dbWorld?.name
        );
        return (
            premadeWorld?.settlements?.map((s) => ({
                id: `${premadeWorld.id}:${s.name}`,
                name: s.name,
            })) ?? []
        );
    }, [data, worldId]);

    const dbListAll = useMemo(() => {
        // Only show settlements when a world is selected
        if (!worldId) {
            return [];
        }

        const worlds = (data?.worlds ?? []) as any[];
        const w = worlds.find((w: any) => w.id === worldId);
        return ((w?.settlements ?? []) as any[]).map((s) => ({
            id: s.id,
            name: s.name || "Untitled",
        }));
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
