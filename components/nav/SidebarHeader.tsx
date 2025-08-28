/** @format */

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { IconBrandDiscord, IconBrandGithub } from "@tabler/icons-react";
import { Home, Newspaper, ScrollText } from "lucide-react";
import { ThemeToggle } from "../theme/theme-toggle";

export function SidebarHeader() {
    return (
        <header
            className="fixed bottom-0 left-0 right-0 z-40
                       md:static md:bottom-auto
                       h-[var(--header-height)] md:h-[var(--header-height)]
                       shrink-0 flex items-center gap-2
                       border-t md:border-b
                       bg-background/60 backdrop-blur-sm
                       transition-[width,height] ease-linear
                       group-has-data-[collapsible=icon]/sidebar-wrapper:md:h-[var(--header-height)]
                       pb-[env(safe-area-inset-bottom)]"
        >
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
