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
import { LogoSidebar } from "@/components/brand/logo";
import { TopbarDocsBlog } from "@/components/nav/TopbarDocsBlog";
import { listSectionIndex } from "@/lib/markdown";
import { DocsSidebarNav } from "@/components/nav/DocsSidebarNav";
import { SectionSidebarNav } from "@/components/nav/SectionSidebarNav";
import { listSectionFolderTree } from "@/lib/markdown";
import { FooterSection } from "@/app/(home)/_components/layout/sections/footer";

export const metadata: Metadata = {
    title: sectionTitleTemplate("Docs"),
    description: "Generate various things for D&D 5e",
};

export default function Layout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    // Group docs by frontmatter category
    const byCategory = new Map<string, { href: string; title: string }[]>();
    for (const i of listSectionIndex("docs")) {
        const cat = (i.category ?? "General").toString();
        if (!byCategory.has(cat)) byCategory.set(cat, []);
        byCategory.get(cat)!.push({ href: i.href, title: i.title });
    }
    const groups = Array.from(byCategory.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([label, items]) => ({ label, items }));
    const folderTree = listSectionFolderTree("docs");
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
                    label="Docs"
                    tree={folderTree}
                />
            </Sidebar>
            <SidebarInset>
                <TopbarDocsBlog section="docs" />
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
