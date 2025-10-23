/** @format */

"use client";

import React from "react";
import db from "@/lib/db";
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
        worlds: { $: { where: {} }, settlements: {} },
    });

    const dbWorldsAll = (data?.worlds ?? []).map((w: any) => ({
        id: w.id,
        name: w.name || "Untitled",
        isPremade: Boolean(w.isPremade),
    }));

    const myWorlds = dbWorldsAll.filter((w) => !w.isPremade);
    const premadeWorlds = dbWorldsAll.filter((w) => w.isPremade);

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
                {myWorlds.length ? (
                    <>
                        {premadeWorlds.length ? <SelectSeparator /> : null}
                        <SelectGroup>
                            <SelectLabel>My worlds</SelectLabel>
                            {myWorlds.map((w) => (
                                <SelectItem
                                    key={`db-${w.id}`}
                                    value={w.id}
                                >
                                    {w.name}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </>
                ) : null}
                {premadeWorlds.length ? (
                    <SelectGroup>
                        <SelectLabel>Pre-made worlds</SelectLabel>
                        {premadeWorlds.map((w) => (
                            <SelectItem
                                key={`premade-${w.id}`}
                                value={w.id}
                            >
                                {w.name}
                            </SelectItem>
                        ))}
                    </SelectGroup>
                ) : null}
            </SelectContent>
        </Select>
    );
}
