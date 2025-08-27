/** @format */

"use client";

import { useEffect, useState } from "react";

/**
 * useMediaQuery - returns true when the given media query matches.
 *
 * - query: either a media query string or a number (interpreted as px for
 *   `(min-width: ${n}px)`).
 * - defaultState: value to use during SSR / before matchMedia is available.
 */
export function useMediaQuery(
    query: string | number,
    defaultState = false
): boolean {
    const mq = typeof query === "number" ? `(min-width: ${query}px)` : query;

    const [matches, setMatches] = useState<boolean>(() => {
        if (typeof window === "undefined" || !window.matchMedia) {
            return defaultState;
        }
        return window.matchMedia(mq).matches;
    });

    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) {
            return;
        }

        const mql = window.matchMedia(mq);
        const update = () => setMatches(mql.matches);

        // sync initially
        setMatches(mql.matches);

        // prefer modern API, fall back to legacy addListener
        if (typeof mql.addEventListener === "function") {
            mql.addEventListener("change", update);
        } else {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore - legacy API
            mql.addListener(update);
        }

        return () => {
            if (typeof mql.removeEventListener === "function") {
                mql.removeEventListener("change", update);
            } else {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore - legacy API
                mql.removeListener(update);
            }
        };
    }, [mq]);

    return matches;
}
