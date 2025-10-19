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
    SidebarMenuAction,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import { getAvailableTools } from "@/lib/tools";
import { icons } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/badge";
import { useUser } from "@/hooks/useUser";
import { ChevronUp, Plus } from "lucide-react";

const stripSuffix = (title: string) =>
    title.replace(" Generator", "").replace(" Management", "");

type NavMainProps = {
    handleLinkClick?: () => void;
};

export function NavMain({ handleLinkClick }: NavMainProps) {
    const pathname = usePathname();
    const availableTools = getAvailableTools().slice();
    const allTools = availableTools.sort((a, b) =>
        stripSuffix(a.title).localeCompare(stripSuffix(b.title))
    );
    const { plan } = useUser();
    const partyAllowedPlans = ["basic", "plus", "pro"];

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
                                // runtime-safe lucide icon name (fallback to "Map")
                                const safeIconName = (icons as any)[tool.icon]
                                    ? (tool.icon as keyof typeof icons)
                                    : ("Map" as keyof typeof icons);

                                const href = tool.url.replace(
                                    "https://app.viziersvault.com",
                                    ""
                                );
                                const isActive = pathname === href;
                                const isDisabled = !tool.released;

                                const isParty = tool.title
                                    .toLowerCase()
                                    .includes("party");

                                const canShowPlus = isParty
                                    ? partyAllowedPlans.includes(
                                          (plan || "").toLowerCase()
                                      )
                                    : true;

                                return (
                                    <SidebarMenuItem
                                        key={tool.id}
                                        className="flex items-center justify-between w-full"
                                    >
                                        <SidebarMenuButton
                                            asChild={!isDisabled}
                                            isActive={isActive && !isDisabled}
                                            tooltip={tool.title}
                                            className={cn(
                                                "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                                                isDisabled &&
                                                    "opacity-40 cursor-not-allowed",
                                                !isDisabled &&
                                                    (isActive
                                                        ? "bg-muted text-primary"
                                                        : "text-muted-foreground hover:bg-accent/50")
                                            )}
                                        >
                                            {isDisabled ? (
                                                <div className="flex items-center w-full">
                                                    <Icon
                                                        name={safeIconName}
                                                        color="currentColor"
                                                        size={16}
                                                        className="h-4 w-4 flex-shrink-0 mr-2"
                                                    />
                                                    <span className="ml-3">
                                                        {stripSuffix(
                                                            tool.title
                                                        )}
                                                        {tool.released ===
                                                            "new" && (
                                                            <Badge className="ml-2">
                                                                New
                                                            </Badge>
                                                        )}
                                                    </span>
                                                </div>
                                            ) : (
                                                <Link
                                                    href={href}
                                                    onClick={handleLinkClick}
                                                    className="flex items-center w-full"
                                                    prefetch={true}
                                                >
                                                    <Icon
                                                        name={safeIconName}
                                                        color="currentColor"
                                                        size={16}
                                                        className="h-4 w-4 flex-shrink-0"
                                                    />
                                                    <span className="ml-3">
                                                        {stripSuffix(
                                                            tool.title
                                                        )}
                                                        {tool.released ===
                                                            "new" && (
                                                            <Badge className="ml-2">
                                                                New
                                                            </Badge>
                                                        )}
                                                    </span>
                                                </Link>
                                            )}
                                        </SidebarMenuButton>

                                        {canShowPlus ? (
                                            <SidebarMenuAction
                                                asChild={!isDisabled}
                                                className={cn(
                                                    isDisabled &&
                                                        "opacity-40 cursor-not-allowed"
                                                )}
                                            >
                                                {isDisabled ? (
                                                    <div>
                                                        <Plus className="w-4 h-4" />
                                                    </div>
                                                ) : (
                                                    <Link
                                                        href={`${href}?modalOpen=1`}
                                                        prefetch={true}
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </Link>
                                                )}
                                            </SidebarMenuAction>
                                        ) : (
                                            <div className="w-4 h-4" />
                                        )}
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
