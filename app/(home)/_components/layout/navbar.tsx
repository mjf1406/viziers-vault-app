/** @format */

"use client";
import { ChevronsDown, Github, Menu } from "lucide-react";
import React from "react";
import Link from "next/link";
import {
    Sheet,
    SheetContent,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
    NavigationMenu,
    NavigationMenuList,
    NavigationMenuItem,
    NavigationMenuLink,
} from "@radix-ui/react-navigation-menu";
import { Separator } from "@radix-ui/react-separator";
import { ThemeToggle } from "@/components/theme/theme-toggle";

interface RouteProps {
    href: string;
    label: string;
}

const routeList: RouteProps[] = [
    {
        href: "#features",
        label: "Tools",
    },
    {
        href: "#integration",
        label: "Integration",
    },
    {
        href: "#philosophy",
        label: "Philosophy",
    },
    {
        href: "#pricing",
        label: "Pricing",
    },
    {
        href: "#team",
        label: "Team",
    },
    {
        href: "#disclosure",
        label: "Disclosure",
    },
    {
        href: "#community",
        label: "Community",
    },
    {
        href: "#faq",
        label: "FAQ",
    },
    {
        href: "#contact",
        label: "Contact",
    },
];

export const Navbar = () => {
    const [isOpen, setIsOpen] = React.useState(false);
    return (
        <header className="shadow-inner bg-opacity-15 w-full sticky top-5 z-40 border-b border-secondary bg-card">
            <div className="max-w-7xl mx-auto px-4 flex justify-between items-center p-2">
                <Link
                    href="/"
                    className="font-bold text-lg flex items-center"
                >
                    <ChevronsDown className="bg-gradient-to-tr border-secondary from-primary via-primary/70 to-primary rounded-lg w-9 h-9 mr-2 border text-white" />
                    Vizier&apos;s Vault
                </Link>
                {/* <!-- Mobile --> */}
                <div className="flex items-center lg:hidden">
                    <Sheet
                        open={isOpen}
                        onOpenChange={setIsOpen}
                    >
                        <SheetTrigger asChild>
                            <Menu
                                onClick={() => setIsOpen(!isOpen)}
                                className="cursor-pointer lg:hidden"
                            />
                        </SheetTrigger>

                        <SheetContent
                            side="left"
                            className="flex flex-col justify-between rounded-tr-2xl rounded-br-2xl bg-card border-secondary"
                        >
                            <div>
                                <SheetHeader className="mb-4 ml-4">
                                    <SheetTitle className="flex items-center">
                                        <Link
                                            href="/"
                                            className="flex items-center"
                                        >
                                            <ChevronsDown className="bg-gradient-to-tr border-secondary from-primary via-primary/70 to-primary rounded-lg w-9 h-9 mr-2 border text-white" />
                                            Vizier&apos;s Vault
                                        </Link>
                                    </SheetTitle>
                                </SheetHeader>

                                <div className="flex flex-col gap-2">
                                    {routeList.map(({ href, label }) => (
                                        <Button
                                            key={href}
                                            onClick={() => setIsOpen(false)}
                                            asChild
                                            variant="ghost"
                                            className="justify-start text-base"
                                        >
                                            <Link href={href}>{label}</Link>
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <SheetFooter className="flex-col sm:flex-col justify-start items-start">
                                <Separator className="mb-2" />

                                <ThemeToggle />
                            </SheetFooter>
                        </SheetContent>
                    </Sheet>
                </div>

                {/* <!-- Desktop --> */}
                <NavigationMenu className="hidden lg:block mx-auto">
                    <NavigationMenuList>
                        <NavigationMenuItem>
                            {routeList.map(({ href, label }) => (
                                <NavigationMenuLink
                                    key={href}
                                    asChild
                                >
                                    <Link
                                        href={href}
                                        className="text-base px-2"
                                    >
                                        {label}
                                    </Link>
                                </NavigationMenuLink>
                            ))}
                        </NavigationMenuItem>
                    </NavigationMenuList>
                </NavigationMenu>

                <div className="hidden lg:flex">
                    <ThemeToggle />
                </div>
            </div>
        </header>
    );
};
