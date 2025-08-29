/** @format */

"use client";

import React from "react";
import Link from "next/link";
import { BadgeCheck, ChevronsUpDown, LogOut, Settings } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar";
import db from "@/lib/db";
import { useUser } from "@/hooks/useUser";

function UserPreview({
    displayName,
    avatarSrc,
    plan,
    avatarClassName = "h-8 w-8 rounded-lg",
    showPlan = true,
}: {
    displayName?: string | null;
    avatarSrc?: string | null;
    plan?: string | null;
    avatarClassName?: string;
    showPlan?: boolean;
}) {
    const initials = (displayName?.slice(0, 2) ?? "U").toUpperCase();

    return (
        <>
            <Avatar className={avatarClassName}>
                <AvatarImage
                    src={avatarSrc ?? undefined}
                    alt={displayName ?? ""}
                />
                <AvatarFallback className="rounded-lg">
                    {initials}
                </AvatarFallback>
            </Avatar>

            <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{displayName}</span>
                {showPlan && (
                    <span className="truncate text-xs text-muted-foreground">
                        {plan}
                    </span>
                )}
            </div>
        </>
    );
}

export function NavUser() {
    const { isMobile } = useSidebar();
    const { displayName, avatarSrc, plan } = useUser();

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <UserPreview
                                displayName={displayName}
                                avatarSrc={avatarSrc}
                                plan={plan}
                            />

                            <ChevronsUpDown className="ml-auto size-4" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                        side={isMobile ? "bottom" : "right"}
                        align="end"
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="p-0 font-normal">
                            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                <UserPreview
                                    displayName={displayName}
                                    avatarSrc={avatarSrc}
                                    plan={plan}
                                />
                            </div>
                        </DropdownMenuLabel>

                        <DropdownMenuSeparator />

                        <DropdownMenuGroup>
                            <DropdownMenuItem asChild>
                                <Link
                                    href="/app/account"
                                    className="flex items-center"
                                >
                                    <BadgeCheck className="mr-2 h-4 w-4" />
                                    Account
                                </Link>
                            </DropdownMenuItem>

                            <DropdownMenuItem asChild>
                                <Link
                                    href="/app/settings"
                                    className="flex items-center"
                                >
                                    <Settings className="mr-2 h-4 w-4" />
                                    Settings
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuGroup>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                            className="cursor-pointer"
                            onSelect={() => {
                                db.auth.signOut();
                            }}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
