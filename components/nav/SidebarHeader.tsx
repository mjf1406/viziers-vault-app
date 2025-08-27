/** @format */

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { IconBrandDiscord, IconBrandGithub } from "@tabler/icons-react";
import { Home, Newspaper, ScrollText } from "lucide-react";
import { ThemeToggle } from "../theme/theme-toggle";

export function SidebarHeader() {
    return (
        <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
            <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
                <SidebarTrigger className="-ml-1" />
                <Separator
                    orientation="vertical"
                    className="mx-2 data-[orientation=vertical]:h-4"
                />
                <div className="ml-auto flex justify-center items-center">
                    <Button
                        variant="ghost"
                        asChild
                        size="icon"
                        className="hidden sm:flex"
                    >
                        <a
                            href="/"
                            rel="noopener noreferrer"
                            target="_blank"
                        >
                            <Home />
                        </a>
                    </Button>
                    <Button
                        variant="ghost"
                        asChild
                        size="icon"
                        className="hidden sm:flex"
                    >
                        <a
                            href="/blog"
                            rel="noopener noreferrer"
                            target="_blank"
                        >
                            <Newspaper />
                        </a>
                    </Button>
                    <Button
                        variant="ghost"
                        asChild
                        size="icon"
                        className="hidden sm:flex"
                    >
                        <a
                            href="/docs"
                            rel="noopener noreferrer"
                            target="_blank"
                        >
                            <ScrollText />
                        </a>
                    </Button>
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
                    <Button
                        variant="ghost"
                        asChild
                        size="icon"
                        className="hidden sm:flex"
                    >
                        <a
                            href="#"
                            rel="noopener noreferrer"
                            target="_blank"
                        >
                            <IconBrandDiscord />
                        </a>
                    </Button>
                    <ThemeToggle />
                </div>
            </div>
        </header>
    );
}
