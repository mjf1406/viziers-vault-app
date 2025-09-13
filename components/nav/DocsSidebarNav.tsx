/** @format */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import React from "react";

// Note: listSectionIndex is a server function reading fs. For a client nav we can
// accept precomputed items via props to avoid bundling fs. We'll create
// a small server wrapper to pass these in.

export type DocsNavGroup = {
    label: string;
    items: { href: string; title: string }[];
};

export function DocsSidebarNav({ groups }: { groups: DocsNavGroup[] }) {
    const pathname = usePathname();
    return (
        <SidebarContent>
            {groups.map((group) => (
                <SidebarGroup key={group.label}>
                    <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {group.items.map((it) => (
                                <SidebarMenuItem key={it.href}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={pathname === it.href}
                                    >
                                        <Link href={it.href}>{it.title}</Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            ))}
        </SidebarContent>
    );
}
