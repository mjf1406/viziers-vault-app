/** @format */

"use client";

import React, { useMemo } from "react";
import db from "@/lib/db";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Map,
    Sword,
    BookOpen,
    Globe,
    Star,
    Store,
    Swords,
    Orbit,
    Users,
    LayoutDashboard,
} from "lucide-react";
import Link from "next/link";

type Tool = {
    id: string;
    title: string;
    icon: string;
    slug?: string;
};

type Generation = {
    id: string | number;
    type: string;
    title: string;
    description?: string;
    generatedAt: string;
    lastAccessedAt: string;
    preview?: string;
    toolId?: string;
};

export default function UserDashboard() {
    const user = db.useUser();

    // Query the current user and all linked entities directly from InstantDB
    const { isLoading, error, data } = db.useQuery({
        $users: {
            worlds: {},
            settlements: {},
            spellbooks: {},
            magicShops: {},
            battleMaps: {},
            encounters: {},
            parties: {},
            starSystems: {},
            galaxies: {},
        },
    });

    const tools: Tool[] = useMemo(
        () => [
            { id: "worlds", title: "Worlds", icon: "Globe" },
            { id: "settlements", title: "Settlements", icon: "Map" },
            { id: "spellbooks", title: "Spellbooks", icon: "BookOpen" },
            { id: "magicShops", title: "Magic Shops", icon: "Store" },
            { id: "encounters", title: "Encounters", icon: "Swords" },
            { id: "battleMaps", title: "Battle Maps", icon: "Map" },
            { id: "parties", title: "Parties", icon: "Users" },
            { id: "starSystems", title: "Star Systems", icon: "Star" },
            { id: "galaxies", title: "Galaxies", icon: "Orbit" },
        ],
        []
    );

    const perToolRecent: Record<string, Generation[]> = useMemo(() => {
        const userRow: any = data?.$users?.[0] ?? null;
        if (!userRow) return {};

        const toIso = (d: any | undefined) =>
            d ? new Date(d as any).toISOString() : (undefined as any);

        const build = (
            arr: any[] | undefined,
            type: string,
            titleKey: string = "name"
        ): Generation[] => {
            const items = Array.isArray(arr) ? arr : [];
            return items
                .map((r: any) => {
                    const createdAt = r?.createdAt ?? undefined;
                    const updatedAt = r?.updatedAt ?? undefined;
                    const title =
                        (typeof r?.[titleKey] === "string" && r[titleKey]) ||
                        `${type.slice(0, 1).toUpperCase()}${type.slice(1)} ${
                            r?.id ? "#" + String(r.id).slice(-6) : ""
                        }`;
                    const generatedAt =
                        toIso(createdAt) ??
                        toIso(updatedAt) ??
                        new Date(0).toISOString();
                    const lastAccessedAt =
                        toIso(updatedAt) ?? toIso(createdAt) ?? generatedAt;
                    return {
                        id: r.id,
                        type,
                        title,
                        generatedAt,
                        lastAccessedAt,
                        description: undefined,
                        preview: undefined,
                        toolId: type,
                    } as Generation;
                })
                .sort(
                    (a, b) =>
                        new Date(b.lastAccessedAt).getTime() -
                        new Date(a.lastAccessedAt).getTime()
                )
                .slice(0, 5);
        };

        const byTool: Record<string, Generation[]> = {};
        byTool["worlds"] = build(userRow.worlds, "worlds");
        byTool["settlements"] = build(userRow.settlements, "settlements");
        byTool["spellbooks"] = build(userRow.spellbooks, "spellbooks");
        byTool["magicShops"] = build(userRow.magicShops, "magicShops");
        byTool["encounters"] = build(userRow.encounters, "encounters");
        byTool["battleMaps"] = build(userRow.battleMaps, "battleMaps");
        byTool["parties"] = build(userRow.parties, "parties");
        byTool["starSystems"] = build(userRow.starSystems, "starSystems");
        byTool["galaxies"] = build(userRow.galaxies, "galaxies");

        return byTool;
    }, [data?.$users]);

    const recent: Generation[] = useMemo(() => {
        const all: Generation[] = Object.values(perToolRecent).flat();
        return all
            .sort(
                (a, b) =>
                    new Date(b.lastAccessedAt).getTime() -
                    new Date(a.lastAccessedAt).getTime()
            )
            .slice(0, 5);
    }, [perToolRecent]);

    const getIconComponent = (iconName: string) => {
        const iconMap: { [key: string]: any } = {
            Map,
            Store,
            BookOpen,
            Swords,
            Sword,
            Globe,
            Star,
            Orbit,
            Users,
        };
        return iconMap[iconName] || Map;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return (
            date.toLocaleDateString() +
            " " +
            date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        );
    };

    const allowedViewTypes = useMemo(
        () =>
            new Set<string>([
                "battleMaps",
                "encounters",
                "galaxies",
                "magicShops",
                "parties",
                "regions",
                "spellbooks",
                "starSystems",
                "worlds",
            ]),
        []
    );

    return (
        <div className="container mx-auto space-y-4 min-h-dvh">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold flex gap-3 items-center justify-center">
                    <LayoutDashboard /> My Dashboard
                </h1>
            </div>

            {/* All Recent Generations Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        My Latest Creations
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        {recent === null ? (
                            <div className="p-4 text-sm text-muted-foreground">
                                Loading...
                            </div>
                        ) : recent.length === 0 ? (
                            <div className="p-6">
                                <div className="text-sm text-muted-foreground mb-3">
                                    No recent generations yet — try creating
                                    something new.
                                </div>
                                <div className="grid grid-cols-6 gap-4">
                                    {(tools || []).map((t) => {
                                        const Icon = getIconComponent(t.icon);
                                        return (
                                            <div
                                                key={t.id}
                                                className="flex flex-col items-center justify-center
                                   text-center p-3 border rounded"
                                            >
                                                <Icon className="h-6 w-6 mb-2" />
                                                <div className="text-xs text-muted-foreground">
                                                    {t.title.replace(
                                                        " Generator",
                                                        ""
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left p-2 font-medium">
                                            Title
                                        </th>
                                        <th className="text-left p-2 font-medium">
                                            Type
                                        </th>
                                        <th className="text-left p-2 font-medium">
                                            Generated
                                        </th>
                                        <th className="text-left p-2 font-medium">
                                            Last Accessed
                                        </th>
                                        <th className="text-left p-2 font-medium">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recent.map((gen) => (
                                        <tr
                                            key={gen.id}
                                            className="border-b hover:bg-muted/50"
                                        >
                                            <td className="p-2 font-medium">
                                                {gen.title}
                                            </td>
                                            <td className="p-2 capitalize">
                                                {gen.type.replace("-", " ")}
                                            </td>
                                            <td className="p-2 text-muted-foreground">
                                                {formatDate(gen.generatedAt)}
                                            </td>
                                            <td className="p-2 text-muted-foreground">
                                                {formatDate(gen.lastAccessedAt)}
                                            </td>
                                            <td className="p-2">
                                                {allowedViewTypes.has(
                                                    gen.type
                                                ) && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                    >
                                                        View
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Generator Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(tools || []).map((tool) => {
                    const Icon = getIconComponent(tool.icon);
                    const recentForTool =
                        perToolRecent && perToolRecent[tool.id]
                            ? perToolRecent[tool.id]
                            : [];

                    return (
                        <Card key={tool.id}>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <Icon className="h-5 w-5" />
                                        <span>
                                            {tool.title
                                                .replace(" Generator", "")
                                                .replace(" Management", "")}
                                        </span>
                                    </div>
                                    <span className="text-sm font-normal text-muted-foreground">
                                        {recentForTool.length}
                                    </span>
                                </CardTitle>
                                <CardDescription>
                                    {recentForTool.length > 0
                                        ? `5 most recently accessed ${tool.title.toLowerCase()}`
                                        : `No ${tool.title.toLowerCase()} yet`}
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-3">
                                {recentForTool.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs">
                                            <thead>
                                                <tr className="border-b">
                                                    <th className="text-left p-1 font-medium w-1/2">
                                                        Title
                                                    </th>
                                                    <th className="text-left p-1 font-medium w-1/4">
                                                        Gen
                                                    </th>
                                                    <th className="text-left p-1 font-medium w-1/4">
                                                        Acc
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {recentForTool.map((gen) => (
                                                    <tr
                                                        key={gen.id}
                                                        className="border-b hover:bg-muted/50"
                                                    >
                                                        <td className="p-1 font-medium truncate">
                                                            {gen.title}
                                                        </td>
                                                        <td className="p-1 text-muted-foreground text-[10px]">
                                                            {new Date(
                                                                gen.generatedAt
                                                            ).toLocaleDateString()}
                                                        </td>
                                                        <td className="p-1 text-muted-foreground text-[10px]">
                                                            {new Date(
                                                                gen.lastAccessedAt
                                                            ).toLocaleDateString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-6">
                                        <Icon className="h-8 w-8 mb-3 text-muted-foreground" />
                                        <div className="text-sm mb-3 text-muted-foreground">
                                            No{" "}
                                            {tool.title.replace(
                                                " Generator",
                                                ""
                                            )}{" "}
                                            yet
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>
                        Generate something new or manage your content
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Button
                            variant="outline"
                            className="h-20 flex-col space-y-2"
                            asChild
                        >
                            <Link href="/app/encounter-generator?modalOpen=1">
                                <Swords className="h-5 w-5" />
                                <span className="text-sm">New Encounter</span>
                            </Link>
                        </Button>
                        <Button
                            variant="outline"
                            className="h-20 flex-col space-y-2"
                            asChild
                        >
                            <Link href="/app/spellbook-generator?modalOpen=1">
                                <BookOpen className="h-5 w-5" />
                                <span className="text-sm">New Spellbook</span>
                            </Link>
                        </Button>
                        <Button
                            variant="outline"
                            className="h-20 flex-col space-y-2"
                            asChild
                        >
                            <Link href="/app/magic-shop-generator?modalOpen=1">
                                <Store className="h-5 w-5" />
                                <span className="text-sm">New Magic Shop</span>
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
