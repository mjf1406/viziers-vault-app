/** @format */

"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DiscordIcon } from "@/components/brand/discord";
import { IconBrandGithub } from "@tabler/icons-react";

export function TopbarDocsBlog({
    section,
    onSearchChange,
    initialQuery = "",
}: {
    section: "docs" | "blog";
    onSearchChange?: (value: string) => void;
    initialQuery?: string;
}) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const [q, setQ] = React.useState(initialQuery);

    React.useEffect(() => {
        const current = searchParams.get("q") ?? "";
        setQ(current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    const updateQuery = React.useCallback(
        (value: string) => {
            const params = new URLSearchParams(
                Array.from(searchParams.entries())
            );
            if (value) params.set("q", value);
            else params.delete("q");
            router.replace(`${pathname}?${params.toString()}`);
        },
        [router, pathname, searchParams]
    );
    return (
        <header
            className="sticky top-0 z-40 border-b bg-background/60 backdrop-blur"
            style={{ height: "var(--app-header-height)" }}
        >
            <div
                className="flex items-center gap-2 px-3 md:px-4"
                style={{ height: "var(--app-header-height)" }}
            >
                <SidebarTrigger className="md:hidden" />
                <div className="ml-auto hidden md:flex items-center gap-2">
                    <Input
                        placeholder={`Search ${section}...`}
                        value={q}
                        onChange={(e) => {
                            setQ(e.target.value);
                            onSearchChange?.(e.target.value);
                            updateQuery(e.target.value);
                        }}
                        className="h-9 w-64"
                        aria-label={`Search ${section}`}
                    />
                    <Button
                        variant="ghost"
                        size="sm"
                        asChild
                    >
                        <Link href="/app/dashboard">App</Link>
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        asChild
                    >
                        <Link href="/blog">Blog</Link>
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        asChild
                    >
                        <Link href="/docs">Docs</Link>
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        className="hidden sm:flex"
                    >
                        <Link
                            href="https://github.com/mjf1406/viziers-vault-app"
                            rel="noopener noreferrer"
                            target="_blank"
                        >
                            <IconBrandGithub />
                        </Link>
                    </Button>
                    <DiscordIcon />
                    <ThemeToggle />
                </div>
            </div>
        </header>
    );
}
