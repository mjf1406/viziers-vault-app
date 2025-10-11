/** @format */

"use client";

import React from "react";
import db from "@/lib/db";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export type WorldOption = { id: string; name: string };

export default function WorldSelect({
    value,
    onChange,
    placeholder = "Select a world",
}: {
    value?: string | null;
    onChange: (id: string | null) => void;
    placeholder?: string;
}) {
    const { isLoading, error, data } = db.useQuery({
        worlds: {},
    });

    const worlds = (data?.worlds ?? []).map((w: any) => ({
        id: w.id,
        name: w.name || "Untitled",
    }));

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
                {worlds.map((w) => (
                    <SelectItem
                        key={w.id}
                        value={w.id}
                    >
                        {w.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
