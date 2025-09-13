/** @format */

import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { IconBrandGithub } from "@tabler/icons-react";
import { ThemeToggle } from "../theme/theme-toggle";
import { DiscordIcon } from "../brand/discord";

export function SidebarHeader() {
    return (
        <header className="sticky top-0 z-40 h-14 border-b bg-background/60 backdrop-blur">
            <div className="flex h-14 items-center gap-2 px-3 md:px-4">
                <SidebarTrigger />
                <div className="ml-auto hidden md:flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="hidden sm:flex"
                    >
                        <a href="/app/dashboard">App</a>
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="hidden sm:flex"
                    >
                        <a href="/blog">Blog</a>
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="hidden sm:flex"
                    >
                        <a href="/docs">Docs</a>
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
                    <DiscordIcon />
                    <ThemeToggle />
                </div>
            </div>
        </header>
    );
}
