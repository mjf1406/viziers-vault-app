/** @format */

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Breadcrumb({
    className,
    ...props
}: React.ComponentProps<"nav">) {
    return (
        <nav
            aria-label="Breadcrumb"
            className={cn("text-sm", className)}
            {...props}
        />
    );
}

export function BreadcrumbList({
    className,
    ...props
}: React.ComponentProps<"ol">) {
    return (
        <ol
            className={cn(
                "flex items-center gap-1 text-muted-foreground",
                className
            )}
            {...props}
        />
    );
}

export function BreadcrumbItem({
    className,
    ...props
}: React.ComponentProps<"li">) {
    return (
        <li
            className={cn("inline-flex items-center gap-1", className)}
            {...props}
        />
    );
}

export function BreadcrumbSeparator({
    className,
    children = "/",
    ...props
}: React.ComponentProps<"span">) {
    return (
        <span
            className={cn("px-1 select-none", className)}
            aria-hidden="true"
            {...props}
        >
            {children}
        </span>
    );
}

export function BreadcrumbLink({
    className,
    href = "#",
    ...props
}: React.ComponentProps<typeof Link>) {
    return (
        <Link
            href={href}
            className={cn("hover:text-foreground transition-colors", className)}
            {...props}
        />
    );
}
