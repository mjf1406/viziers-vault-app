/** @format */

"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
    const { theme, setTheme, resolvedTheme } = useTheme();

    // resolvedTheme is the effective theme ("light" | "dark")
    // If you prefer to treat explicit "system" as separate, adjust logic.
    const current = resolvedTheme === "dark" ? "dark" : "light";
    const isDark = current === "dark";

    const toggle = React.useCallback(() => {
        setTheme(isDark ? "light" : "dark");
    }, [isDark, setTheme]);

    return (
        <Button
            variant="outline"
            size="icon"
            onClick={toggle}
            aria-pressed={isDark}
            aria-label={
                isDark ? "Switch to light theme" : "Switch to dark theme"
            }
            title={isDark ? "Switch to light theme" : "Switch to dark theme"}
            className="relative"
        >
            <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
            <span className="sr-only">
                {isDark ? "Switch to light theme" : "Switch to dark theme"}
            </span>
        </Button>
    );
}
