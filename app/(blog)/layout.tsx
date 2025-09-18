/** @format */

import type { Metadata } from "next";
import { sectionTitleTemplate } from "@/lib/seo";
import React from "react";
import {
    SidebarProvider,
    Sidebar,
    SidebarInset,
    SidebarSeparator,
} from "@/components/ui/sidebar";
import { TopbarDocsBlog } from "@/components/nav/TopbarDocsBlog";
import { BlogSidebarNav, BlogYearGroup } from "@/components/nav/BlogSidebarNav";
import { listSectionIndex } from "@/lib/markdown";
import { LogoSidebar } from "@/components/brand/logo";
import { SectionSidebarNav } from "@/components/nav/SectionSidebarNav";
import { listSectionFolderTree } from "@/lib/markdown";
import { FooterSection } from "@/app/(home)/_components/layout/sections/footer";

export const metadata: Metadata = {
    title: sectionTitleTemplate("Blog"),
    description: "Generate various things for D&D 5e",
};

export default function Layout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    // Build groups: year -> months
    const items = listSectionIndex("blog");
    const map = new Map<
        string,
        Map<string, { href: string; title: string }[]>
    >();
    for (const it of items) {
        const d = it.date ? new Date(it.date) : undefined;
        const year = d ? String(d.getFullYear()) : "Undated";
        const monthIdx = d ? d.getMonth() : 0;
        const monthLabel = d
            ? new Date(d.getFullYear(), monthIdx, 1).toLocaleString("en-US", {
                  month: "long",
                  timeZone: "UTC",
              })
            : "Unknown";
        if (!map.has(year)) map.set(year, new Map());
        const months = map.get(year)!;
        if (!months.has(monthLabel)) months.set(monthLabel, []);
        months.get(monthLabel)!.push({ href: it.href, title: it.title });
    }
    const groups: BlogYearGroup[] = Array.from(map.entries())
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([year, months]) => ({
            year,
            months: Array.from(months.entries())
                .sort(
                    (a, b) =>
                        new Date(`${b[0]} 1, 2000`).getMonth() -
                        new Date(`${a[0]} 1, 2000`).getMonth()
                )
                .map(([label, items]) => ({ label, items })),
        }));

    const folderTree = listSectionFolderTree("blog");
    return (
        <SidebarProvider>
            <Sidebar
                variant="sidebar"
                collapsible="offcanvas"
                className="hidden md:flex flex-col w-64 h-screen border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
            >
                <div className="p-2">
                    <LogoSidebar />
                </div>
                <SidebarSeparator />
                <SectionSidebarNav
                    label="Blog"
                    tree={folderTree}
                />
            </Sidebar>
            <SidebarInset>
                <TopbarDocsBlog section="blog" />
                <div className="px-4 md:px-8 py-6">{children}</div>
                <div className="relative">
                    <div
                        className="absolute left-0 top-0 bottom-0 border-l"
                        aria-hidden
                    />
                    <FooterSection />
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
