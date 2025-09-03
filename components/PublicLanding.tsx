/** @format */

"use client";

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
    ChevronDown,
    Map,
    Sword,
    BookOpen,
    Globe,
    Star,
    Store,
    Sparkles,
    Table,
    Clock,
    User,
    Swords,
    Orbit,
    Users,
} from "lucide-react";
import Link from "next/link";
import { getToolsWithMockData } from "@/lib/tools";
import LoginButton from "./auth/LoginButton";

export default function PublicLanding() {
    // Mock data for the example dashboard
    const allRecentGenerations = [
        {
            id: 1,
            type: "battle-map",
            title: "Ancient Ruins",
            generatedAt: "2024-01-15T10:30:00Z",
            lastAccessedAt: "2024-01-15T14:20:00Z",
        },
        {
            id: 2,
            type: "encounter",
            title: "Goblin Ambush",
            generatedAt: "2024-01-14T16:45:00Z",
            lastAccessedAt: "2024-01-15T09:15:00Z",
        },
        {
            id: 3,
            type: "spellbook",
            title: "Arcane Tome",
            generatedAt: "2024-01-13T11:20:00Z",
            lastAccessedAt: "2024-01-14T18:30:00Z",
        },
        {
            id: 4,
            type: "world",
            title: "Floating Islands",
            generatedAt: "2024-01-12T13:10:00Z",
            lastAccessedAt: "2024-01-13T15:45:00Z",
        },
        {
            id: 5,
            type: "magic-shop",
            title: "Enchanted Emporium",
            generatedAt: "2024-01-11T09:30:00Z",
            lastAccessedAt: "2024-01-12T12:20:00Z",
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
            Swords,
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
        <div className="container mx-auto space-y-4 min-h-dvh">
            {/* Premium Features Floating Card */}
            <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-transparent h-32 pointer-events-none z-10" />

                {/* Card lifted above the blur so it appears to float */}
                <div className="relative z-30 -translate-y-2">
                    <Card className="border-4 border-primary bg-gradient-to-r from-primary/5 to-secondary/5 shadow-2xl">
                        <CardHeader className="text-center">
                            <CardTitle className="flex items-center justify-center space-x-2 text-2xl">
                                <Sparkles className="h-6 w-6 text-primary" />
                                <span>Premium Dashboard</span>
                            </CardTitle>
                            <CardDescription className="text-lg">
                                Unlock your personal dashboard with saved
                                generations and advanced features. <br />
                                View the example below to see what it&apos;s
                                like before you subscribe.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="text-center space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-primary">
                                        Save &amp; Organize
                                    </h4>
                                    <p className="text-muted-foreground">
                                        Keep all your generations in one place
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="font-semibold text-primary">
                                        Advanced Settings
                                    </h4>
                                    <p className="text-muted-foreground">
                                        Customize generation parameters
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="font-semibold text-primary">
                                        Export Options
                                    </h4>
                                    <p className="text-muted-foreground">
                                        Download in multiple formats
                                    </p>
                                </div>
                            </div>

                            <LoginButton size={"lg"}>
                                Subscribe to Premium
                            </LoginButton>
                        </CardContent>
                    </Card>
                </div>

                {/* Elliptical blur halo:
                    - moved below the card (top: calc(100% + 12px)) so it doesn't overlap the
                        translucent card and won't show through it
                    - full viewport width, extends down ~200px
                    - hidden on small screens (md) for perf
                    - dark-mode uses a subtle tint; light-mode uses transparent backgrounds so
                        nothing visible bleeds through the card */}
                <div
                    aria-hidden="true"
                    className="absolute left-1/2 -translate-x-1/2 z-20 pointer-events-none hidden md:block"
                    style={{
                        width: "calc(100% - 18rem)",
                        height: "380px", // total vertical size of the ellipse
                        top: "calc(100% + 12px)", // push it below the card/container
                    }}
                >
                    {/* DARK MODE: tinted halo (visible in dark theme) */}
                    <div
                        className="hidden dark:block absolute inset-0 rounded-full"
                        style={{
                            background: "rgba(0,0,0,0.035)",
                            WebkitMaskImage:
                                "radial-gradient(ellipse at center, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0) 100%)",
                            maskImage:
                                "radial-gradient(ellipse at center, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0) 100%)",
                            WebkitBackdropFilter: "blur(10px)",
                            backdropFilter: "blur(10px)",
                        }}
                    />

                    <div
                        className="hidden dark:block absolute"
                        style={{
                            top: "8%",
                            right: "6%",
                            bottom: "22%",
                            left: "6%",
                            borderRadius: "50%",
                            background: "rgba(0,0,0,0.025)",
                            WebkitMaskImage:
                                "radial-gradient(ellipse at center, rgba(0,0,0,1) 0%, rgba(0,0,0,0.65) 45%, rgba(0,0,0,0) 100%)",
                            maskImage:
                                "radial-gradient(ellipse at center, rgba(0,0,0,1) 0%, rgba(0,0,0,0.65) 45%, rgba(0,0,0,0) 100%)",
                            WebkitBackdropFilter: "blur(16px)",
                            backdropFilter: "blur(16px)",
                        }}
                    />

                    <div
                        className="hidden dark:block absolute"
                        style={{
                            top: "20%",
                            right: "18%",
                            bottom: "36%",
                            left: "18%",
                            borderRadius: "50%",
                            background: "rgba(0,0,0,0.02)",
                            WebkitMaskImage:
                                "radial-gradient(ellipse at center, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 75%)",
                            maskImage:
                                "radial-gradient(ellipse at center, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 75%)",
                            WebkitBackdropFilter: "blur(26px)",
                            backdropFilter: "blur(26px)",
                        }}
                    />

                    {/* LIGHT MODE: transparent halo (no tint) — prevents showing a visible
                        ellipse through semi-transparent card while still blurring the
                        dashboard content below */}
                    <div
                        className="block dark:hidden absolute inset-0 rounded-full"
                        style={{
                            background: "transparent",
                            WebkitMaskImage:
                                "radial-gradient(ellipse at center, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%)",
                            maskImage:
                                "radial-gradient(ellipse at center, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%)",
                            WebkitBackdropFilter: "blur(14px)",
                            backdropFilter: "blur(14px)",
                        }}
                    />

                    <div
                        className="block dark:hidden absolute"
                        style={{
                            top: "8%",
                            right: "6%",
                            bottom: "22%",
                            left: "6%",
                            borderRadius: "50%",
                            background: "transparent",
                            WebkitMaskImage:
                                "radial-gradient(ellipse at center, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 75%)",
                            maskImage:
                                "radial-gradient(ellipse at center, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 75%)",
                            WebkitBackdropFilter: "blur(22px)",
                            backdropFilter: "blur(22px)",
                        }}
                    />

                    <div
                        className="block dark:hidden absolute"
                        style={{
                            top: "20%",
                            right: "18%",
                            bottom: "36%",
                            left: "18%",
                            borderRadius: "50%",
                            background: "transparent",
                            WebkitMaskImage:
                                "radial-gradient(ellipse at center, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 75%)",
                            maskImage:
                                "radial-gradient(ellipse at center, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 75%)",
                            WebkitBackdropFilter: "blur(32px)",
                            backdropFilter: "blur(32px)",
                        }}
                    />
                </div>
            </div>

            {/* Example Dashboard */}
            <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent h-24 pointer-events-none" />
                <div className="relative space-y-8 opacity-60">
                    {/* Example Header */}
                    <div className="flex justify-between items-center">
                        <div className="space-y-1">
                            <h2 className="text-2xl font-bold tracking-tight">
                                Welcome back, Example User!
                            </h2>
                            <p className="text-muted-foreground">
                                Your personal RPG toolkit dashboard
                            </p>
                        </div>
                    </div>

                    {/* All Recent Generations Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <Table className="h-5 w-5" />
                                <span>
                                    5 Most Recently Accessed Generations
                                </span>
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
                                        {allRecentGenerations
                                            .slice(0, 5)
                                            .map((gen) => (
                                                <tr
                                                    key={gen.id}
                                                    className="border-b hover:bg-muted/50"
                                                >
                                                    <td className="p-2 font-medium">
                                                        {gen.title}
                                                    </td>
                                                    <td className="p-2 capitalize">
                                                        {gen.type.replace(
                                                            "-",
                                                            " "
                                                        )}
                                                    </td>
                                                    <td className="p-2 text-muted-foreground">
                                                        {formatDate(
                                                            gen.generatedAt
                                                        )}
                                                    </td>
                                                    <td className="p-2 text-muted-foreground">
                                                        {formatDate(
                                                            gen.lastAccessedAt
                                                        )}
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
                                                        .replace(
                                                            " Generator",
                                                            ""
                                                        )
                                                        .replace(
                                                            " Management",
                                                            ""
                                                        )}
                                                </span>
                                            </div>
                                            <span className="text-sm font-normal text-muted-foreground">
                                                {tool.mockCount}
                                            </span>
                                        </CardTitle>
                                        <CardDescription>
                                            {tool.mockCount &&
                                            tool.mockCount > 0
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
                                                                        key={
                                                                            gen.id
                                                                        }
                                                                        className="border-b hover:bg-muted/50"
                                                                    >
                                                                        <td className="p-1 font-medium truncate">
                                                                            {
                                                                                gen.title
                                                                            }
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
                </div>
            </div>
        </div>
    );
}
