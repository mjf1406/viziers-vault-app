/** @format */
"use client";

import React, { useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Sidebar,
    SidebarHeader,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarSeparator,
    useSidebar,
} from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area"; // keep import for reference; usage left commented
import db from "@/lib/db";
import { NavUser } from "./nav-user";
import { LogoSidebar } from "../brand/logo";
import { LayoutDashboard } from "lucide-react";
import { NavMain } from "./nav-main";
import LoginButton from "../auth/LoginButton";

export function AppSidebar() {
    const pathname = usePathname();
    const { toggleSidebar } = useSidebar();

    // Close sidebar only on mobile (< md which is 768px in Tailwind)
    const handleLinkClick = useCallback(() => {
        if (typeof window === "undefined") return;
        if (window.innerWidth < 768) {
            toggleSidebar?.();
        }
    }, [toggleSidebar]);

    return (
        <Sidebar
            className={
                "hidden md:flex flex-col w-64 h-screen border-r " +
                "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
            }
            variant="sidebar"
            collapsible="icon"
        >
            <SidebarHeader>
                <LogoSidebar />
            </SidebarHeader>

            <SidebarSeparator />

            <SidebarContent>
                {/* <ScrollArea className="h-full [&>div>div]:flex [&>div>div]:flex-col [&>div>div]:h-full"> */}

                <SidebarGroup>
                    {/* <SidebarGroupLabel>Application</SidebarGroupLabel> */}
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    asChild
                                    isActive={pathname === "/app/dashboard"}
                                    tooltip="Dashboard"
                                >
                                    <Link
                                        href="/app/dashboard"
                                        onClick={handleLinkClick}
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
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <NavMain handleLinkClick={handleLinkClick} />
                {/* </ScrollArea> */}
            </SidebarContent>

            <SidebarFooter className="border-t">
                <db.SignedIn>
                    <NavUser />
                </db.SignedIn>

                <db.SignedOut>
                    <LoginButton
                        onClick={handleLinkClick}
                        className="w-full"
                    >
                        Sign in
                    </LoginButton>
                </db.SignedOut>
            </SidebarFooter>
        </Sidebar>
    );
}
