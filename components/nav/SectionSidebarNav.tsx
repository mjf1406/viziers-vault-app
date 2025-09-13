/** @format */

"use client";

import React from "react";
import Link from "next/link";
import {
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { FolderTree } from "@/lib/markdown";
import { ChevronDown } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";

export function SectionSidebarNav({
    tree,
    label,
}: {
    tree: FolderTree[];
    label: string;
}) {
    const pathname = usePathname();
    return (
        <SidebarContent>
            <SidebarGroup>
                <SidebarGroupLabel>{label}</SidebarGroupLabel>
                <SidebarGroupContent>
                    <div className="space-y-1">
                        {tree.map((node) => (
                            <TreeNode
                                key={node.href ?? node.slug.join("/")}
                                node={node}
                                pathname={pathname}
                            />
                        ))}
                    </div>
                </SidebarGroupContent>
            </SidebarGroup>
        </SidebarContent>
    );
}

function TreeNode({ node, pathname }: { node: FolderTree; pathname: string }) {
    const { isMobile, setOpenMobile } = useSidebar();
    const isFolder = !!node.children?.length;
    const [open, setOpen] = React.useState(true);
    if (isFolder) {
        return (
            <div className="px-2">
                <button
                    className="w-full text-left text-sm font-medium py-1.5 hover:underline inline-flex items-center gap-1"
                    onClick={() => setOpen((v) => !v)}
                    aria-expanded={open}
                >
                    <ChevronDown
                        className={`h-4 w-4 transition-transform ${
                            open ? "rotate-0" : "-rotate-90"
                        }`}
                        aria-hidden
                    />
                    {node.name}
                </button>
                {open ? (
                    <div className="ml-2 border-l pl-2">
                        {node.children!.map((child) => (
                            <TreeNode
                                key={child.href ?? child.slug.join("/")}
                                node={child}
                                pathname={pathname}
                            />
                        ))}
                    </div>
                ) : null}
            </div>
        );
    }
    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton
                    asChild
                    isActive={pathname === node.href}
                >
                    <Link
                        href={node.href!}
                        onClick={() => {
                            if (isMobile) setOpenMobile(false);
                        }}
                    >
                        {node.title ?? node.slug.at(-1)}
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
