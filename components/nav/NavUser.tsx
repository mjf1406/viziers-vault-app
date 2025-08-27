/** @format */

"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
    IconCreditCard,
    IconDotsVertical,
    IconLogout,
    IconNotification,
    IconUserCircle,
    IconSettings,
} from "@tabler/icons-react";

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
import { Separator } from "../ui/separator";

type NavUserProps = {
    user?: {
        name?: string | null;
        email?: string | null;
        avatar?: string | null;
    } | null;
};

export function NavUser({ user: initialUser }: NavUserProps) {
    const { isMobile } = useSidebar();
    const [user, setUser] = useState<NavUserProps["user"]>(initialUser ?? null);
    const query = { $users: { profile: { $files: {} } } };
    const { isLoading, error, data } = db.useQuery(query);
    const userInfo = data?.$users[0];
    const displayName = userInfo?.profile?.name ?? "Account";
    const displayEmail = userInfo?.email ?? "";
    const avatarSrc = userInfo?.profile?.$files?.url ?? undefined;

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <Avatar className="h-8 w-8 rounded-lg grayscale">
                                <AvatarImage
                                    src={avatarSrc}
                                    alt={displayName}
                                />
                                <AvatarFallback className="rounded-lg">
                                    {(
                                        displayName?.slice(0, 2) ?? "U"
                                    ).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>

                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-medium">
                                    {displayName}
                                </span>
                                <span className="text-muted-foreground truncate text-xs">
                                    {displayEmail}
                                </span>
                            </div>

                            <IconDotsVertical className="ml-auto h-4 w-4" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                        className="min-w-[14rem] rounded-lg"
                        side={isMobile ? "bottom" : "right"}
                        align="end"
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="p-0 font-normal">
                            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                <Avatar className="h-8 w-8 rounded-lg">
                                    <AvatarImage
                                        src={avatarSrc}
                                        alt={displayName}
                                    />
                                    <AvatarFallback className="rounded-lg">
                                        {(
                                            displayName?.slice(0, 2) ?? "U"
                                        ).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>

                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-medium">
                                        {displayName}
                                    </span>
                                    <span className="text-muted-foreground truncate text-xs">
                                        {displayEmail}
                                    </span>
                                </div>
                            </div>
                        </DropdownMenuLabel>

                        <DropdownMenuSeparator />

                        <DropdownMenuGroup>
                            <DropdownMenuItem asChild>
                                <Link
                                    href="/account"
                                    className="flex items-center"
                                >
                                    <IconUserCircle className="mr-2 h-4 w-4" />
                                    Account
                                </Link>
                            </DropdownMenuItem>

                            <DropdownMenuItem asChild>
                                <Link
                                    href="/settings"
                                    className="flex items-center"
                                >
                                    <IconSettings className="mr-2 h-4 w-4" />
                                    Settings
                                </Link>
                            </DropdownMenuItem>

                            <DropdownMenuItem asChild>
                                <Link
                                    href="/billing"
                                    className="flex items-center"
                                >
                                    <IconCreditCard className="mr-2 h-4 w-4" />
                                    Billing
                                </Link>
                            </DropdownMenuItem>

                            <DropdownMenuItem asChild>
                                <Link
                                    href="/notifications"
                                    className="flex items-center"
                                >
                                    <IconNotification className="mr-2 h-4 w-4" />
                                    Notifications
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuGroup>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                            className="cursor-pointer"
                            onSelect={() => {
                                // sign out via your auth client; this matches earlier usage
                                db.auth.signOut();
                            }}
                        >
                            <IconLogout className="mr-2 h-4 w-4" />
                            Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
