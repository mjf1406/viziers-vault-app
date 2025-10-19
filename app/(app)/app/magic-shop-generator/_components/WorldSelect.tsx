/** @format */

"use client";

import React from "react";
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
        worlds: { settlements: {} },
    });

    const dbWorlds = (data?.worlds ?? []).map((w: any) => ({
        id: w.id,
        name: w.name || "Untitled",
    }));

    const premadeWorlds = PREMADE_WORLDS.map((w) => ({
        id: w.id,
        name: w.name,
    }));

    const worlds = [...premadeWorlds, ...dbWorlds];

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
                {dbWorlds.length ? (
                    <>
                        {premadeWorlds.length ? <SelectSeparator /> : null}
                        <SelectGroup>
                            <SelectLabel>My worlds</SelectLabel>
                            {dbWorlds.map((w) => (
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
