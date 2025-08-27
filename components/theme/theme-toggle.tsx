/** @format */

"use client";

import * as React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
    const { resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    // While not mounted, render a neutral button that won't differ from the
    // server (keeps SSR deterministic). After mount, derive the actual state.
    const isDark = mounted ? resolvedTheme === "dark" : false;

    const toggle = React.useCallback(() => {
        setTheme(isDark ? "light" : "dark");
    }, [isDark, setTheme]);

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            aria-pressed={mounted ? isDark : undefined}
            aria-label={
                mounted
                    ? isDark
                        ? "Switch to light theme"
                        : "Switch to dark theme"
                    : "Toggle theme"
            }
            title={
                mounted
                    ? isDark
                        ? "Switch to light theme"
                        : "Switch to dark theme"
                    : "Toggle theme"
            }
            className="relative"
        >
            <Sun
                className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all
                      dark:scale-0 dark:-rotate-90"
            />
            <Moon
                className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90
                       transition-all dark:scale-100 dark:rotate-0"
            />
            <span className="sr-only">
                {mounted
                    ? isDark
                        ? "Switch to light theme"
                        : "Switch to dark theme"
                    : "Toggle theme"}
            </span>
        </Button>
    );
}
