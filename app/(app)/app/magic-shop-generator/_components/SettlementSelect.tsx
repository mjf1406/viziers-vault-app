/** @format */

"use client";

import React, { useMemo } from "react";
import db from "@/lib/db";
import {
    Select,
    SelectContent,
    SelectItem,
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
        if (worldId) {
            const w = worlds.find((w: any) => w.id === worldId);
            const list = ((w?.settlements ?? []) as any[]).map((s) => ({
                id: s.id,
                name: s.name || "Untitled",
            }));
            return list;
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
                {settlements.map((s) => (
                    <SelectItem
                        key={s.id}
                        value={s.id}
                    >
                        {s.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
