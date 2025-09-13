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

export type BlogMonthGroup = {
    label: string;
    items: { href: string; title: string }[];
};
export type BlogYearGroup = { year: string; months: BlogMonthGroup[] };

export function BlogSidebarNav({ groups }: { groups: BlogYearGroup[] }) {
    const pathname = usePathname();
    return (
        <SidebarContent>
            {groups.map((year) => (
                <SidebarGroup key={year.year}>
                    <SidebarGroupLabel>{year.year}</SidebarGroupLabel>
                    <SidebarGroupContent>
                        {year.months.map((month) => (
                            <div
                                key={month.label}
                                className="mb-2"
                            >
                                <div className="text-xs text-sidebar-foreground/70 px-2 py-1">
                                    {month.label}
                                </div>
                                <SidebarMenu>
                                    {month.items.map((it) => (
                                        <SidebarMenuItem key={it.href}>
                                            <SidebarMenuButton
                                                asChild
                                                isActive={pathname === it.href}
                                            >
                                                <Link href={it.href}>
                                                    {it.title}
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    ))}
                                </SidebarMenu>
                            </div>
                        ))}
                    </SidebarGroupContent>
                </SidebarGroup>
            ))}
        </SidebarContent>
    );
}
