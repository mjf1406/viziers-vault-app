/** @format */

// components\auth\LoginButton.tsx
"use client";

import React from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type LoginButtonProps = React.ComponentPropsWithoutRef<typeof Button> & {
    children?: React.ReactNode;
    /**
     * Where to send the user to start login. Defaults to /auth/login
     */
    loginPath?: string;
    /**
     * Fallback return path if we can't compute one. Defaults to /app/dashboard
     */
    fallback?: string;
    /**
     * Optional explicit returnTo value (skip computing from pathname/search)
     */
    returnTo?: string | null;
};

const LoginButton = React.forwardRef<HTMLButtonElement, LoginButtonProps>(
    (
        {
            children,
            loginPath = "/app/login",
            fallback = "/app/dashboard",
            returnTo: returnToProp = null,
            ...buttonProps
        },
        ref
    ) => {
        const pathname = usePathname();
        const searchParams = useSearchParams();
        const router = useRouter();

        const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
            // call consumer's onClick first (if any)
            if (typeof buttonProps.onClick === "function") {
                buttonProps.onClick(e);
            }
            // if consumer prevented default, don't navigate
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

            void router.push(url);
        };

        return (
            <Button
                ref={ref}
                {...buttonProps}
                onClick={handleClick}
            >
                {children}
            </Button>
        );
    }
);

LoginButton.displayName = "LoginButton";
export default LoginButton;
