/** @format */

"use client";

import React, { useEffect, useState } from "react";
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
    LogOut,
    User,
    Map,
    Sword,
    BookOpen,
    Globe,
    Star,
    Store,
    Table,
    Plus,
    Swords,
    Orbit,
    Users,
    LayoutDashboard,
} from "lucide-react";

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

    const [tools, setTools] = useState<Tool[] | null>(null);
    const [recent, setRecent] = useState<Generation[] | null>(null);
    const [perToolRecent, setPerToolRecent] = useState<Record<
        string,
        Generation[]
    > | null>(null);

    useEffect(() => {
        let mounted = true;

        async function load() {
            try {
                const [toolsRes, recentRes] = await Promise.all([
                    fetch("/api/tools").then((r) => (r.ok ? r.json() : [])),
                    fetch("/api/generations/recent?limit=5").then((r) =>
                        r.ok ? r.json() : []
                    ),
                ]);

                if (!mounted) return;

                setTools(toolsRes || []);
                setRecent(recentRes || []);

                const perTool: Record<string, Generation[]> = {};
                await Promise.all(
                    (toolsRes || []).map(async (tool: Tool) => {
                        try {
                            const res = await fetch(
                                `/api/tools/${encodeURIComponent(
                                    tool.id
                                )}/recent?limit=5`
                            );
                            perTool[tool.id] = res.ok ? await res.json() : [];
                        } catch {
                            perTool[tool.id] = [];
                        }
                    })
                );

                if (!mounted) return;
                setPerToolRecent(perTool);
            } catch (err) {
                console.error("Failed to load dashboard data", err);
                setTools([]);
                setRecent([]);
                setPerToolRecent({});
            }
        }

        load();
        return () => {
            mounted = false;
        };
    }, []);

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

    return (
        <div className="container mx-auto p-4 xl:p-10 space-y-4 min-h-dvh">
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
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                >
                                                    View
                                                </Button>
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
                                    <div className="space-y-2">
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
                                                    {recentForTool.map(
                                                        (gen) => (
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
                                                        )
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                        <Button
                                            className="w-full"
                                            variant="outline"
                                            size="sm"
                                        >
                                            View All {recentForTool.length}
                                        </Button>
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
                                        <Button
                                            className="w-full"
                                            variant="outline"
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Create First{" "}
                                            {tool.title
                                                .replace(" Generator", "")
                                                .replace(" Management", "")
                                                .slice(0, -1)}
                                        </Button>
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
                        >
                            <Map className="h-5 w-5" />
                            <span className="text-sm">New Map</span>
                        </Button>
                        <Button
                            variant="outline"
                            className="h-20 flex-col space-y-2"
                        >
                            <Swords className="h-5 w-5" />
                            <span className="text-sm">New Encounter</span>
                        </Button>
                        <Button
                            variant="outline"
                            className="h-20 flex-col space-y-2"
                        >
                            <BookOpen className="h-5 w-5" />
                            <span className="text-sm">New Spellbook</span>
                        </Button>
                        <Button
                            variant="outline"
                            className="h-20 flex-col space-y-2"
                        >
                            <Globe className="h-5 w-5" />
                            <span className="text-sm">New World</span>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
