/** @format */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import {
    Menu,
    Map,
    Sword,
    Orbit,
    Store,
    Users,
    BookOpen,
    Star,
    Globe,
    Swords,
} from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

const navigationItems = [
    {
        name: "Battle Map",
        href: "/battle-map-generator",
        icon: Map,
    },
    {
        name: "Encounter",
        href: "/encounter-generator",
        icon: Swords,
    },
    {
        name: "Galaxy",
        href: "/galaxy-generator",
        icon: Orbit,
    },
    {
        name: "Magic Shop",
        href: "/magic-shop-generator",
        icon: Store,
    },
    {
        name: "Parties",
        href: "/parties",
        icon: Users,
    },
    {
        name: "Spellbook",
        href: "/spellbook-generator",
        icon: BookOpen,
    },
    {
        name: "Star System",
        href: "/star-system-generator",
        icon: Star,
    },
    {
        name: "World",
        href: "/world-generator",
        icon: Globe,
    },
];

export function GeneratorsNavbar() {
    const pathname = usePathname();

    return (
        <nav className="flex items-center justify-between w-full px-4 py-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center space-x-6">
                <Link
                    href="/"
                    className="text-xl font-bold text-primary hover:text-primary/80 transition-colors"
                >
                    Vizier's Vault
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center space-x-4">
                    {navigationItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary",
                                    pathname === item.href
                                        ? "text-primary"
                                        : "text-muted-foreground"
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </div>
            </div>

            <div className="flex items-center space-x-2">
                <ThemeToggle />

                {/* Mobile Menu */}
                <Sheet>
                    <SheetTrigger asChild>
                        <Button
                            variant="outline"
                            size="icon"
                            className="md:hidden"
                        >
                            <Menu className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent
                        side="right"
                        className="w-[300px] sm:w-[400px]"
                    >
                        <SheetHeader>
                            <SheetTitle>Navigation</SheetTitle>
                        </SheetHeader>
                        <div className="flex flex-col space-y-4 mt-6">
                            {navigationItems.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "flex items-center space-x-3 text-sm font-medium transition-colors hover:text-primary p-2 rounded-md",
                                            pathname === item.href
                                                ? "text-primary bg-accent"
                                                : "text-muted-foreground hover:bg-accent/50"
                                        )}
                                    >
                                        <Icon className="h-5 w-5" />
                                        <span>{item.name}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </nav>
    );
}
