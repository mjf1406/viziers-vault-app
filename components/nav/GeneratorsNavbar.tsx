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
    Orbit,
    Store,
    Users,
    BookOpen,
    Star,
    Globe,
    Swords,
    User,
    Settings,
    LogOut,
} from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { useState } from "react";
import { getAvailableTools } from "@/lib/tools";
import db from "@/lib/db";

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

const availableTools = getAvailableTools();

const mainTools = availableTools.filter(
    (tool) =>
        ![
            "world-generator",
            "galaxy-generator",
            "star-system-generator",
        ].includes(tool.id)
);

const spaceTools = availableTools.filter((tool) =>
    ["world-generator", "galaxy-generator", "star-system-generator"].includes(
        tool.id
    )
);

const accountItems = [
    {
        name: "Account",
        href: "/account",
        icon: User,
    },
    {
        name: "Settings",
        href: "/settings",
        icon: Settings,
    },
    {
        name: "Sign Out",
        icon: LogOut,
        onClick: () => db.auth.signOut(),
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
                    {/* Main Tools - Alphabetized */}
                    {mainTools
                        .sort((a, b) =>
                            a.title
                                .replace(" Generator", "")
                                .replace(" Management", "")
                                .localeCompare(
                                    b.title
                                        .replace(" Generator", "")
                                        .replace(" Management", "")
                                )
                        )
                        .map((tool) => {
                            const Icon = getIconComponent(tool.icon);
                            return (
                                <Link
                                    key={tool.id}
                                    href={tool.url.replace(
                                        "https://app.viziersvault.com",
                                        ""
                                    )}
                                    className={cn(
                                        "flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary",
                                        pathname ===
                                            tool.url.replace(
                                                "https://app.viziersvault.com",
                                                ""
                                            )
                                            ? "bg-muted px-3 py-2 rounded-lg"
                                            : "text-muted-foreground"
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    <span>
                                        {tool.title
                                            .replace(" Generator", "")
                                            .replace(" Management", "")}
                                    </span>
                                </Link>
                            );
                        })}

                    {/* Navigation Menu for Space Tools */}
                    <NavigationMenu>
                        <NavigationMenuList>
                            <NavigationMenuItem>
                                <NavigationMenuTrigger className="flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary text-muted-foreground">
                                    <Orbit className="h-4 w-4" />
                                    <span>Universe</span>
                                </NavigationMenuTrigger>
                                <NavigationMenuContent>
                                    <div className="w-auto max-w-[600px] p-2 flex gap-2 flex-wrap items-start">
                                        {spaceTools.map((tool) => {
                                            const Icon = getIconComponent(
                                                tool.icon
                                            );
                                            return (
                                                <NavigationMenuLink
                                                    key={tool.id}
                                                    asChild
                                                >
                                                    <Link
                                                        href={tool.url.replace(
                                                            "https://app.viziersvault.com",
                                                            ""
                                                        )}
                                                        className="p-2 rounded-md hover:bg-accent"
                                                    >
                                                        <div className="flex items-center justify-center space-x-2 whitespace-nowrap">
                                                            <Icon className="h-4 w-4 flex-shrink-0" />
                                                            <span>
                                                                {tool.title
                                                                    .replace(
                                                                        " Generator",
                                                                        ""
                                                                    )
                                                                    .replace(
                                                                        " Management",
                                                                        ""
                                                                    )}
                                                            </span>
                                                        </div>
                                                    </Link>
                                                </NavigationMenuLink>
                                            );
                                        })}
                                    </div>
                                </NavigationMenuContent>
                            </NavigationMenuItem>
                        </NavigationMenuList>
                    </NavigationMenu>
                </div>
            </div>

            <div className="flex items-center space-x-2">
                {/* Conditional Account Navigation */}
                <db.SignedIn>
                    {/* Navigation Menu for Account - Authenticated Users */}
                    <NavigationMenu>
                        <NavigationMenuList>
                            <NavigationMenuItem>
                                <NavigationMenuTrigger className="flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary text-muted-foreground">
                                    <User className="h-4 w-4" />
                                    <span className="sr-only">Account</span>
                                </NavigationMenuTrigger>
                                <NavigationMenuContent>
                                    <div className="w-auto max-w-[600px] p-2 flex gap-2 flex-wrap items-start">
                                        {accountItems.map((item) => {
                                            const Icon = item.icon;
                                            if (item.href) {
                                                return (
                                                    <NavigationMenuLink
                                                        key={item.name}
                                                        asChild
                                                    >
                                                        <Link
                                                            href={item.href}
                                                            className="p-2 rounded-md hover:bg-accent"
                                                        >
                                                            <div className="flex items-center justify-center space-x-2 whitespace-nowrap">
                                                                <Icon className="h-4 w-4 flex-shrink-0" />
                                                                <span>
                                                                    {item.name}
                                                                </span>
                                                            </div>
                                                        </Link>
                                                    </NavigationMenuLink>
                                                );
                                            }

                                            return (
                                                <NavigationMenuLink
                                                    key={item.name}
                                                    asChild
                                                >
                                                    <Button
                                                        size={"sm"}
                                                        variant={"ghost"}
                                                        onClick={item.onClick}
                                                        className="p-2 rounded-md hover:bg-accent w-full text-left font-normal"
                                                    >
                                                        <div className="flex items-center justify-center space-x-2 whitespace-nowrap">
                                                            <Icon className="h-4 w-4 flex-shrink-0" />
                                                            <span>
                                                                {item.name}
                                                            </span>
                                                        </div>
                                                    </Button>
                                                </NavigationMenuLink>
                                            );
                                        })}
                                    </div>
                                </NavigationMenuContent>
                            </NavigationMenuItem>
                        </NavigationMenuList>
                    </NavigationMenu>
                </db.SignedIn>

                <db.SignedOut>
                    {/* Sign In Button - Unauthenticated Users */}
                    <Button
                        asChild
                        variant="default"
                        size="sm"
                    >
                        <Link href="/login">Sign In</Link>
                    </Button>
                </db.SignedOut>

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
                            {/* Main Tools - Alphabetized */}
                            {mainTools
                                .sort((a, b) =>
                                    a.title
                                        .replace(" Generator", "")
                                        .replace(" Management", "")
                                        .localeCompare(
                                            b.title
                                                .replace(" Generator", "")
                                                .replace(" Management", "")
                                        )
                                )
                                .map((tool) => {
                                    const Icon = getIconComponent(tool.icon);
                                    return (
                                        <Link
                                            key={tool.id}
                                            href={tool.url.replace(
                                                "https://app.viziersvault.com",
                                                ""
                                            )}
                                            className={cn(
                                                "flex items-center space-x-3 text-sm font-medium transition-colors hover:text-primary p-2 rounded-md",
                                                pathname ===
                                                    tool.url.replace(
                                                        "https://app.viziersvault.com",
                                                        ""
                                                    )
                                                    ? "text-primary bg-accent"
                                                    : "text-muted-foreground hover:bg-accent/50"
                                            )}
                                        >
                                            <Icon className="h-5 w-5" />
                                            <span>
                                                {tool.title
                                                    .replace(" Generator", "")
                                                    .replace(" Management", "")}
                                            </span>
                                        </Link>
                                    );
                                })}

                            {/* Space Tools Section */}
                            <div className="pt-4 border-t">
                                <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                                    Universe
                                </h4>
                                {spaceTools.map((tool) => {
                                    const Icon = getIconComponent(tool.icon);
                                    return (
                                        <Link
                                            key={tool.id}
                                            href={tool.url.replace(
                                                "https://app.viziersvault.com",
                                                ""
                                            )}
                                            className={cn(
                                                "flex items-center space-x-3 text-sm font-medium transition-colors hover:text-primary p-2 rounded-md ml-4",
                                                pathname ===
                                                    tool.url.replace(
                                                        "https://app.viziersvault.com",
                                                        ""
                                                    )
                                                    ? "text-primary bg-accent"
                                                    : "text-muted-foreground hover:bg-accent/50"
                                            )}
                                        >
                                            <Icon className="h-5 w-5" />
                                            <span>
                                                {tool.title
                                                    .replace(" Generator", "")
                                                    .replace(" Management", "")}
                                            </span>
                                        </Link>
                                    );
                                })}
                            </div>

                            {/* Conditional Account Section */}
                            <db.SignedIn>
                                <div className="pt-4 border-t">
                                    <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                                        Account
                                    </h4>
                                    {accountItems.map((item) => {
                                        const Icon = item.icon;
                                        if (item.onClick) {
                                            return (
                                                <button
                                                    key={item.name}
                                                    type="button"
                                                    onClick={item.onClick}
                                                    className={cn(
                                                        "flex items-center space-x-3 text-sm font-medium transition-colors hover:text-primary p-2 rounded-md ml-4 text-muted-foreground hover:bg-accent/50"
                                                    )}
                                                >
                                                    <Icon className="h-5 w-5" />
                                                    <span>{item.name}</span>
                                                </button>
                                            );
                                        }

                                        return (
                                            <Link
                                                key={item.name}
                                                href={item.href}
                                                className={cn(
                                                    "flex items-center space-x-3 text-sm font-medium transition-colors hover:text-primary p-2 rounded-md ml-4",
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
                            </db.SignedIn>

                            <db.SignedOut>
                                <div className="pt-4 border-t">
                                    <Button
                                        asChild
                                        className="w-full"
                                    >
                                        <Link href="/login">Sign In</Link>
                                    </Button>
                                </div>
                            </db.SignedOut>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </nav>
    );
}
