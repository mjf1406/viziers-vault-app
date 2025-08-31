/** @format */

"use client";
import { ChevronsDown, Menu } from "lucide-react";
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
import { Separator } from "@radix-ui/react-separator";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { IconBrandDiscord, IconBrandGithub } from "@tabler/icons-react";
import { LogoTextOnly } from "@/components/brand/logo";
import { DiscordIcon } from "@/components/brand/discord";

interface RouteProps {
    href: string;
    label: string;
    icon?: React.ReactNode;
}

const routeList: RouteProps[] = [
    {
        href: "/web/about",
        label: "About",
    },
    {
        href: "/app/dashboard",
        label: "App",
        // icon: <AppWindow className="w-4 h-4 mr-2" />,
    },
    {
        href: "/blog",
        label: "Blog",
        // icon: <Newspaper className="w-4 h-4 mr-2" />,
    },
    {
        href: "/web/contact",
        label: "Contact",
    },
    {
        href: "/docs",
        label: "Docs",
        // icon: <ScrollText className="w-4 h-4 mr-2" />,
    },
    {
        href: "/web/faq",
        label: "FAQ",
    },
    {
        href: "/web/pricing",
        label: "Pricing",
    },
    {
        href: "/web/team",
        label: "Team",
    },
];

export const Navbar = () => {
    const [isOpen, setIsOpen] = React.useState(false);
    return (
        <header className="shadow-inner bg-opacity-15 w-full sticky top-5 z-40 border-b border-secondary bg-card">
            <div className="max-w-7xl mx-auto px-4 flex justify-between items-center p-2">
                <LogoTextOnly />
                {/* <!-- Mobile --> */}
                <div className="flex items-center md:hidden">
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

                                <div className="flex flex-col gap-2 px-4">
                                    {routeList.map(({ href, label, icon }) => (
                                        <Button
                                            key={href}
                                            onClick={() => setIsOpen(false)}
                                            asChild
                                            variant="ghost"
                                            className="justify-start text-base w-full"
                                        >
                                            <Link
                                                href={href}
                                                className="flex items-center"
                                            >
                                                {icon ?? null}
                                                <span>{label}</span>
                                            </Link>
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <SheetFooter className="flex-col sm:flex-col justify-start items-start px-4">
                                <Separator className="mb-2 w-full" />
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        asChild
                                        size="icon"
                                        className="hidden sm:flex"
                                    >
                                        <a
                                            href="https://github.com/mjf1406/viziers-vault-app"
                                            rel="noopener noreferrer"
                                            target="_blank"
                                        >
                                            <IconBrandGithub />
                                        </a>
                                    </Button>
                                    <DiscordIcon />
                                    <ThemeToggle />
                                </div>
                            </SheetFooter>
                        </SheetContent>
                    </Sheet>
                </div>

                {/* <!-- Desktop --> */}
                <nav className="hidden md:flex mx-auto">
                    <div className="flex">
                        {routeList.map(({ href, label, icon }) => (
                            <Link
                                key={href}
                                href={href}
                                className="text-base px-2 flex items-center hover:bg-muted py-1 rounded-md"
                            >
                                {icon}
                                <span>{label}</span>
                            </Link>
                        ))}
                    </div>
                </nav>

                <div className="hidden md:flex items-center gap-2">
                    <Button
                        variant="ghost"
                        asChild
                        size="icon"
                        className="hidden sm:flex"
                    >
                        <a
                            href="https://github.com/mjf1406/viziers-vault-app"
                            rel="noopener noreferrer"
                            target="_blank"
                        >
                            <IconBrandGithub />
                        </a>
                    </Button>

                    <DiscordIcon />

                    <ThemeToggle />
                </div>
            </div>
        </header>
    );
};
