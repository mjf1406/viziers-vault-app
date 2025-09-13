/** @format */

import React from "react";
import {
    listSectionIndex,
    listSectionFolderTree,
    type FolderTree,
} from "@/lib/markdown";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
export const dynamic = "force-static";

export default async function BlogHomePage({
    searchParams,
}: {
    searchParams: { q?: string };
}) {
    const itemsAll = listSectionIndex("blog");
    const q = (searchParams?.q ?? "").toLowerCase();
    const tree = listSectionFolderTree("blog");

    function collectFiles(
        node: FolderTree
    ): { href: string; title: string; description?: string; date?: string }[] {
        if (!node.children) {
            if (node.href)
                return [
                    {
                        href: node.href,
                        title: node.title ?? node.slug.at(-1) ?? "",
                    },
                ];
            return [];
        }
        const files: {
            href: string;
            title: string;
            description?: string;
            date?: string;
        }[] = [];
        for (const child of node.children) files.push(...collectFiles(child));
        return files;
    }

    const topLevel = tree;
    const rootFiles = topLevel.filter((n) => !n.children && n.href);
    const folderNodes = topLevel.filter((n) => n.children && n.children.length);
    const sections: {
        label: string;
        files: { href: string; title: string }[];
    }[] = [];
    if (rootFiles.length) {
        sections.push({
            label: "General",
            files: rootFiles.map((n) => ({
                href: n.href!,
                title: n.title ?? n.slug.at(-1) ?? "",
            })),
        });
    }
    for (const folder of folderNodes) {
        sections.push({ label: folder.name, files: collectFiles(folder) });
    }

    const filteredSections = sections
        .map((s) => ({
            label: s.label,
            files: q
                ? s.files.filter((f) => f.title.toLowerCase().includes(q))
                : s.files,
        }))
        .filter((s) => s.files.length > 0);
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Blog</h1>
                <p className="text-muted-foreground">
                    Updates, deep-dives, and product news.
                </p>
            </div>
            {/* Header search is global; remove local search here */}
            <Accordion
                type="multiple"
                defaultValue={filteredSections.map((s) => s.label)}
                className="space-y-2"
            >
                {filteredSections.map((section) => (
                    <AccordionItem
                        key={section.label}
                        value={section.label}
                    >
                        <AccordionTrigger className="text-base font-medium">
                            {section.label}
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {section.files.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className="no-underline"
                                    >
                                        <Card className="h-full hover:shadow-md transition-shadow">
                                            <CardHeader>
                                                <CardTitle className="text-lg">
                                                    {item.title}
                                                </CardTitle>
                                            </CardHeader>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    );
}
