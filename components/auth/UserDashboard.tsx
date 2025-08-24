/** @format */

"use client";

import db from "@/lib/db";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import {
    LogOut,
    User,
    Map,
    Sword,
    BookOpen,
    Globe,
    Star,
    Store,
    Clock,
    Plus,
    Table,
} from "lucide-react";
import { getToolsWithMockData } from "@/lib/tools";

export default function UserDashboard() {
    const user = db.useUser();

    const handleSignOut = () => {
        db.auth.signOut();
    };

    // Mock recent generations data - in a real app, this would come from your database
    const allRecentGenerations = [
        {
            id: 1,
            type: "battle-map",
            title: "Ancient Ruins",
            description: "Underground temple with hidden passages",
            generatedAt: "2024-01-15T10:30:00Z",
            lastAccessedAt: "2024-01-15T14:20:00Z",
            preview: "Map Preview",
        },
        {
            id: 2,
            type: "encounter",
            title: "Goblin Ambush",
            description: "Forest encounter with 5 enemies",
            generatedAt: "2024-01-14T16:45:00Z",
            lastAccessedAt: "2024-01-15T09:15:00Z",
            preview: "CR 3",
        },
        {
            id: 3,
            type: "spellbook",
            title: "Arcane Tome",
            description: "15 spells, 3 cantrips",
            generatedAt: "2024-01-13T11:20:00Z",
            lastAccessedAt: "2024-01-14T18:30:00Z",
            preview: "Rare",
        },
        {
            id: 4,
            type: "world",
            title: "Floating Islands",
            description: "The floating islands of Aetheria",
            generatedAt: "2024-01-12T13:10:00Z",
            lastAccessedAt: "2024-01-13T15:45:00Z",
            preview: "High Magic",
        },
        {
            id: 5,
            type: "magic-shop",
            title: "Enchanted Emporium",
            description: "Madame Mystique's shop",
            generatedAt: "2024-01-11T09:30:00Z",
            lastAccessedAt: "2024-01-12T12:20:00Z",
            preview: "Trusted",
        },
    ];

    // Get tools with mock data from tools.ts
    const toolsWithMockData = getToolsWithMockData();

    // Helper function to get icon component from string
    const getIconComponent = (iconName: string) => {
        const iconMap: { [key: string]: any } = {
            Map,
            Store,
            BookOpen,
            Swords: Sword,
            Globe,
            Star,
            Orbit: Star, // Using Star as fallback for Orbit
            Users: User,
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
        <div className="container mx-auto py-6 space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">
                        Welcome back, {user.email?.split("@")[0]}!
                    </h1>
                    <p className="text-muted-foreground">
                        Your personal RPG toolkit dashboard
                    </p>
                </div>
                <div className="flex items-center space-x-4">
                    <ThemeToggle />
                    <Button
                        variant="outline"
                        onClick={handleSignOut}
                        className="flex items-center space-x-2"
                    >
                        <LogOut className="h-4 w-4" />
                        <span>Sign Out</span>
                    </Button>
                </div>
            </div>

            {/* All Recent Generations Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Table className="h-5 w-5" />
                        <span>5 Most Recently Accessed Generations</span>
                    </CardTitle>
                    <CardDescription>
                        Your latest creations across all generators
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
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
                                {allRecentGenerations.slice(0, 5).map((gen) => (
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
                    </div>
                </CardContent>
            </Card>

            {/* Generator Cards with Recent Content Tables */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {toolsWithMockData.map((tool) => {
                    const Icon = getIconComponent(tool.icon);
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
                                        {tool.mockCount}
                                    </span>
                                </CardTitle>
                                <CardDescription>
                                    {tool.mockCount && tool.mockCount > 0
                                        ? `5 most recently accessed ${tool.title.toLowerCase()}`
                                        : `No ${tool.title.toLowerCase()} yet`}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {tool.mockCount &&
                                tool.mockCount > 0 &&
                                tool.mockRecentGenerations ? (
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
                                                    {tool.mockRecentGenerations.map(
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
                                            View All {tool.mockCount}
                                        </Button>
                                    </div>
                                ) : (
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
                            <Sword className="h-5 w-5" />
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
