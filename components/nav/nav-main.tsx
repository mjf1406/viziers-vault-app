/** @format */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import { getAvailableTools } from "@/lib/tools";
import {
    Map,
    Orbit,
    Store,
    Users,
    BookOpen,
    Star,
    Globe,
    Swords,
    ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

const stripSuffix = (title: string) =>
    title.replace(" Generator", "").replace(" Management", "");

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

type NavMainProps = {
    handleLinkClick?: () => void;
};

export function NavMain({ handleLinkClick }: NavMainProps) {
    const pathname = usePathname();
    const availableTools = getAvailableTools().slice();
    const allTools = availableTools.sort((a, b) =>
        stripSuffix(a.title).localeCompare(stripSuffix(b.title))
    );
    return (
        <Collapsible
            defaultOpen
            className="group/collapsible"
        >
            <SidebarGroup>
                <SidebarGroupLabel asChild>
                    <CollapsibleTrigger className="hover:bg-muted">
                        Tools
                        <ChevronUp className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                    </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {allTools.map((tool) => {
                                const Icon = getIconComponent(tool.icon);
                                const href = tool.url.replace(
                                    "https://app.viziersvault.com",
                                    ""
                                );
                                const isActive = pathname === href;
                                return (
                                    <SidebarMenuItem key={tool.id}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={isActive}
                                            tooltip={tool.title}
                                        >
                                            <Link
                                                href={href}
                                                onClick={handleLinkClick}
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
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </CollapsibleContent>
            </SidebarGroup>
        </Collapsible>
    );
}
