/** @format */
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Sidebar,
    SidebarHeader,
    SidebarContent,
    SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Map,
    Orbit,
    Store,
    Users,
    BookOpen,
    Star,
    Globe,
    Swords,
    LayoutDashboard,
} from "lucide-react";
import { useState } from "react";
import { getAvailableTools } from "@/lib/tools";
import db from "@/lib/db";
import { NavUser } from "./NavUser";
import LogoTextOnly from "../brand/logo";

type InstantUser = {
    email?: string | null;
    name?: string | null;
    avatar_url?: string | null;
    // add other fields from your $users entity if needed
};

const getIconComponent = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
        Map,
        Orbit,
        Store,
        Users,
        BookOpen,
        Star,
        Globe,
        Swords,
    };
    return iconMap[iconName] || Map;
};

const stripSuffix = (title: string) =>
    title.replace(" Generator", "").replace(" Management", "");

export function AppSidebar() {
    const pathname = usePathname();
    const [user, setUser] = useState<InstantUser | null>(null);
    const availableTools = getAvailableTools().slice();
    const allTools = availableTools.sort((a, b) =>
        stripSuffix(a.title).localeCompare(stripSuffix(b.title))
    );

    return (
        <Sidebar
            className={
                "hidden md:flex flex-col w-64 h-screen border-r " +
                "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
            }
        >
            {/* Top: site name (site name only here per your request) */}
            <SidebarHeader className="px-4 py-4 flex items-center justify-between">
                <LogoTextOnly />
            </SidebarHeader>

            <Separator />

            {/* Scrollable tool list (alphabetical) */}
            <SidebarContent className="flex-1 px-2 py-4">
                <ScrollArea className="h-full">
                    <nav className="flex flex-col space-y-1">
                        {/* Dashboard link */}
                        <Link
                            href="/app/dashboard"
                            aria-current={
                                pathname === "/app/dashboard"
                                    ? "page"
                                    : undefined
                            }
                            className={cn(
                                "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                                pathname === "/app/dashboard"
                                    ? "bg-muted text-primary"
                                    : "text-muted-foreground hover:bg-accent/50"
                            )}
                        >
                            <LayoutDashboard className="h-4 w-4 flex-shrink-0" />
                            <span className="ml-3">Dashboard</span>
                        </Link>

                        <Separator />

                        {/* Dynamic tool links */}
                        {allTools.map((tool) => {
                            const Icon = getIconComponent(tool.icon);
                            const href = tool.url.replace(
                                "https://app.viziersvault.com",
                                ""
                            );
                            const isActive = pathname === href;
                            return (
                                <Link
                                    key={tool.id}
                                    href={href}
                                    aria-current={isActive ? "page" : undefined}
                                    className={cn(
                                        "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                                        isActive
                                            ? "bg-muted text-primary"
                                            : "text-muted-foreground hover:bg-accent/50"
                                    )}
                                >
                                    <Icon className="h-4 w-4 flex-shrink-0" />
                                    <span className="ml-3">
                                        {stripSuffix(tool.title)}
                                    </span>
                                </Link>
                            );
                        })}
                    </nav>
                </ScrollArea>
            </SidebarContent>

            {/* Bottom: fancy account card with dropdown (includes ThemeToggle inside) */}
            <SidebarFooter className="px-4 py-4 border-t">
                <db.SignedIn>
                    <NavUser />
                </db.SignedIn>

                <db.SignedOut>
                    <Button
                        asChild
                        className="w-full"
                    >
                        <Link href="/app/login">Sign In</Link>
                    </Button>
                </db.SignedOut>
            </SidebarFooter>
        </Sidebar>
    );
}
