/** @format */

import { Dices } from "lucide-react";
import Link from "next/link";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "../ui/sidebar";

export function LogoTextOnly({}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <Link
            href="/"
            className="text-lg font-bold text-primary hover:text-primary/80 transition-colors"
        >
            Vizier's Vault
        </Link>
    );
}

export function LogoSidebar({}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton
                    asChild
                    size="lg"
                >
                    <Link
                        href="/"
                        className="flex h-12 items-center text-primary rounded-md text-sm font-medium transition-colors"
                    >
                        <Dices className="!h-8 !w-8 flex-shrink-0" />
                        <span className="ml-1 text-xl font-bold">
                            Vizier's Vault
                        </span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
