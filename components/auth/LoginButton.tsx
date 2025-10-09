/** @format */

"use client";

import React from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

type LoginButtonProps = React.ComponentPropsWithoutRef<typeof Button> & {
    children?: React.ReactNode;
    loginPath?: string;
    fallback?: string;
    returnTo?: string | null;
    gapPx?: number;
    horizontalPaddingPx?: number;
    iconPx?: number;
};

function useTextFits(
    btnRef: React.RefObject<HTMLButtonElement | null>,
    textRef: React.RefObject<HTMLSpanElement | null>,
    opts: { iconPx: number; gapPx: number; horizontalPaddingPx: number }
) {
    const { iconPx, gapPx, horizontalPaddingPx } = opts;
    const [fits, setFits] = React.useState(true);

    React.useEffect(() => {
        const btn = btnRef.current;
        if (!btn) return;

        const update = () => {
            const buttonWidth = btn.clientWidth;
            const textWidth = textRef.current?.offsetWidth ?? 0;
            const needsText = textWidth > 0;
            const required =
                horizontalPaddingPx +
                iconPx +
                (needsText ? gapPx + textWidth : 0) +
                horizontalPaddingPx;

            setFits(buttonWidth >= required);
        };

        update(); // initial
        const ro = new ResizeObserver(update);
        ro.observe(btn);
        return () => ro.disconnect();
    }, [btnRef, textRef, iconPx, gapPx, horizontalPaddingPx]);

    return fits;
}

const LoginButton = React.forwardRef<HTMLButtonElement, LoginButtonProps>(
    (
        {
            children,
            loginPath = "/app/login",
            fallback = "/app/dashboard",
            returnTo: returnToProp = null,
            gapPx = 8,
            horizontalPaddingPx = 16,
            iconPx = 16,
            onClick,
            size,
            ...buttonProps
        },
        forwardedRef
    ) => {
        const pathname = usePathname();
        const searchParams = useSearchParams();
        const router = useRouter();

        const internalBtnRef = React.useRef<HTMLButtonElement | null>(null);

        const setRefs = React.useCallback(
            (node: HTMLButtonElement | null) => {
                (
                    internalBtnRef as React.MutableRefObject<HTMLButtonElement | null>
                ).current = node;
                if (typeof forwardedRef === "function") {
                    forwardedRef(node);
                } else if (forwardedRef) {
                    (
                        forwardedRef as React.MutableRefObject<HTMLButtonElement | null>
                    ).current = node;
                }
            },
            [forwardedRef]
        );

        const textRef = React.useRef<HTMLSpanElement | null>(null);

        const textFits = useTextFits(internalBtnRef, textRef, {
            iconPx,
            gapPx,
            horizontalPaddingPx,
        });
        const iconOnly = !textFits;

        const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
            // Call consumer onClick first
            if (onClick) onClick(e);
            // If consumer prevented default, stop
            if (e.defaultPrevented) return;

            const search = searchParams?.toString();
            const current = (pathname ?? "") + (search ? `?${search}` : "");
            const returnTo =
                returnToProp ??
                (current && current.startsWith("/") ? current : fallback);

            const sep = loginPath.includes("?") ? "&" : "?";
            const url = `${loginPath}${sep}returnTo=${encodeURIComponent(
                returnTo
            )}`;

            router.push(url);
        };

        return (
            <Button
                ref={setRefs}
                {...buttonProps}
                size={iconOnly ? "icon" : size}
                onClick={handleClick}
                aria-label="Log in"
            >
                <LogIn
                    style={{ width: iconPx, height: iconPx }}
                    className="shrink-0"
                />
                <span
                    className={iconOnly ? "sr-only" : "ml-2"}
                    ref={textRef}
                >
                    {children}
                </span>
            </Button>
        );
    }
);

LoginButton.displayName = "LoginButton";
export default LoginButton;
