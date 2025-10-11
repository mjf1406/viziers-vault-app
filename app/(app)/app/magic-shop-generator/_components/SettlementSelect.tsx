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
        settlements: {},
    });

    const settlements = useMemo(() => {
        const all = (data?.settlements ?? []) as any[];
        const filtered = worldId ? all.filter((s) => s.world === worldId) : all;
        return filtered.map((s) => ({ id: s.id, name: s.name || "Untitled" }));
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
