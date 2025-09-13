/** @format */
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

export type HeadingItem = { id: string; text: string; depth: number };

export function OnThisPage({
    headings,
    className,
    maxDepth = 3,
}: {
    headings: HeadingItem[];
    className?: string;
    maxDepth?: number; // include headings up to this depth
}) {
    const items = useMemo(
        () => headings.filter((h) => h.depth <= maxDepth),
        [headings, maxDepth]
    );
    const [activeId, setActiveId] = useState<string | null>(null);
    const listRef = useRef<HTMLUListElement | null>(null);
    const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});

    useEffect(() => {
        if (!items.length) return;

        const headerOffsetPx = 96; // approximate space for topbar (matches top-24-ish)
        let ticking = false;

        const computeActive = () => {
            ticking = false;
            let current: string | null = null;
            for (const h of items) {
                const el = document.getElementById(h.id);
                if (!el) continue;
                const rect = el.getBoundingClientRect();
                if (rect.top <= headerOffsetPx + 8) current = h.id; // last one above offset wins
            }
            if (!current && items.length) current = items[0].id;
            setActiveId((prev) => (prev === current ? prev : current));
        };

        const onScroll = () => {
            if (!ticking) {
                ticking = true;
                requestAnimationFrame(computeActive);
            }
        };

        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
        // initial
        computeActive();
        return () => {
            window.removeEventListener("scroll", onScroll as any);
            window.removeEventListener("resize", onScroll as any);
        };
    }, [items]);

    useEffect(() => {
        if (!activeId) return;
        const activeLink = linkRefs.current[activeId];
        const container = listRef.current;
        if (!activeLink || !container) return;
        // Keep the active link in view within the scrollable TOC
        const linkRect = activeLink.getBoundingClientRect();
        const contRect = container.getBoundingClientRect();
        if (linkRect.top < contRect.top) {
            activeLink.scrollIntoView({ block: "nearest" });
        } else if (linkRect.bottom > contRect.bottom) {
            activeLink.scrollIntoView({ block: "nearest" });
        }
    }, [activeId]);

    if (items.length === 0) return null;
    return (
        <nav
            className={className}
            aria-label="On this page"
        >
            <div className="text-sm font-medium mb-2">On this page</div>
            <ul
                ref={listRef}
                className="space-y-1 text-sm max-h-[calc(100vh-6rem)] overflow-auto pr-2"
            >
                {items.map((h) => (
                    <li
                        key={h.id}
                        className={depthClass(h.depth)}
                    >
                        <Link
                            href={`#${h.id}`}
                            ref={(el) => {
                                linkRefs.current[h.id] = el;
                            }}
                            aria-current={
                                activeId === h.id ? "true" : undefined
                            }
                            className={
                                (activeId === h.id
                                    ? "text-foreground font-medium"
                                    : "text-muted-foreground hover:text-foreground") +
                                " block transition-colors"
                            }
                        >
                            {h.text}
                        </Link>
                    </li>
                ))}
            </ul>
        </nav>
    );
}

function depthClass(depth: number): string {
    switch (depth) {
        case 1:
            return "pl-0";
        case 2:
            return "pl-2";
        case 3:
            return "pl-4";
        case 4:
            return "pl-6";
        default:
            return "pl-8";
    }
}
