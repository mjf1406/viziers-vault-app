/** @format */

"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type ProfileInfo = { name?: string; picture?: string | null };

type Props = {
    clientId: string;
    nonce: string;
    onSuccess: (idToken: string, info?: ProfileInfo | null) => void;
    onError?: (err?: any) => void;
    onLoadingChange?: (loading: boolean) => void; // parent listens; child only turns it on
};

export default function GoogleCustomButton({
    clientId,
    nonce,
    onSuccess,
    onError,
    onLoadingChange,
}: Props) {
    const [ready, setReady] = useState(false);
    const [isPrompting, setIsPrompting] = useState(false);
    const gotCredentialRef = useRef(false);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const initGsi = () => {
            if ((window as any).google?.accounts?.id) {
                try {
                    (window as any).google.accounts.id.initialize({
                        client_id: clientId,
                        callback: (res: any) => {
                            if (res?.credential) {
                                handleCredential(res.credential);
                            } else {
                                onError?.(res);
                            }
                        },
                        nonce,
                        // Mobile reliability improvements
                        use_fedcm_for_prompt: true,
                        itp_support: true,
                        cancel_on_tap_outside: false,
                        context: "signin",
                    });
                    (window as any).google.accounts.id.disableAutoSelect?.();
                    setReady(true);
                    return true;
                } catch (e) {
                    setReady(Boolean((window as any).google?.accounts?.id));
                    return false;
                }
            }
            return false;
        };

        if (initGsi()) return;

        const src = "https://accounts.google.com/gsi/client";
        const existing = document.querySelector(`script[src="${src}"]`);
        if (!existing) {
            const s = document.createElement("script");
            s.src = src;
            s.async = true;
            s.defer = true;
            s.onload = () => initGsi();
            document.head.appendChild(s);
        } else {
            const t = setInterval(() => {
                if (initGsi()) clearInterval(t);
            }, 150);
            return () => clearInterval(t);
        }
    }, [clientId, nonce, onSuccess, onError]);

    // decode JWT payload (base64url)
    const decodeJwtPayload = (token: string): any | null => {
        try {
            const parts = token.split(".");
            if (parts.length < 2) return null;
            const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
            const padded = payload.padEnd(
                Math.ceil(payload.length / 4) * 4,
                "="
            );
            const decoded = atob(padded);
            const json = decodeURIComponent(
                decoded
                    .split("")
                    .map(
                        (c) =>
                            "%" +
                            ("00" + c.charCodeAt(0).toString(16)).slice(-2)
                    )
                    .join("")
            );
            return JSON.parse(json);
        } catch (e) {
            console.error("Failed to decode JWT payload", e);
            return null;
        }
    };

    const handleCredential = (credential: string) => {
        setIsPrompting(true);
        onLoadingChange?.(true);
        gotCredentialRef.current = true;
        try {
            const payload = decodeJwtPayload(credential);
            const name: string | undefined = payload?.name;
            const picture: string | undefined = payload?.picture;
            onSuccess(credential, { name, picture });
        } catch (err) {
            console.error("Error handling Google credential", err);
            onSuccess(credential);
        } finally {
            // Re-enable the button; parent controls the main overlay
            setIsPrompting(false);
        }
    };

    const handleClick = () => {
        try {
            if (!(window as any).google?.accounts?.id) {
                throw new Error("Google Identity SDK not ready");
            }

            setIsPrompting(true);
            gotCredentialRef.current = false;

            const attemptPrompt = (allowFedcmToggle: boolean) => {
                (window as any).google.accounts.id.prompt(
                    (notification: any) => {
                        try {
                            if (
                                typeof notification.isDisplayed ===
                                    "function" &&
                                notification.isDisplayed()
                            ) {
                                // One Tap is displayed; keep loading until either credential or cancel
                                return;
                            }

                            const dismissed =
                                (typeof notification.isNotDisplayed ===
                                    "function" &&
                                    notification.isNotDisplayed()) ||
                                (typeof notification.isSkippedMoment ===
                                    "function" &&
                                    notification.isSkippedMoment()) ||
                                (typeof notification.isDismissedMoment ===
                                    "function" &&
                                    notification.isDismissedMoment());

                            const notDisplayedReason =
                                typeof notification.getNotDisplayedReason ===
                                "function"
                                    ? notification.getNotDisplayedReason()
                                    : undefined;
                            const dismissedReason =
                                typeof notification.getDismissedReason ===
                                "function"
                                    ? notification.getDismissedReason()
                                    : undefined;
                            const skippedReason =
                                typeof notification.getSkippedReason ===
                                "function"
                                    ? notification.getSkippedReason()
                                    : undefined;

                            if (dismissed && !gotCredentialRef.current) {
                                // Retry once toggling FedCM to handle quirky mobile browsers
                                if (allowFedcmToggle) {
                                    try {
                                        (
                                            window as any
                                        ).google.accounts.id.initialize({
                                            client_id: clientId,
                                            callback: (res: any) => {
                                                if (res?.credential) {
                                                    handleCredential(
                                                        res.credential
                                                    );
                                                } else {
                                                    onError?.(res);
                                                }
                                            },
                                            nonce,
                                            use_fedcm_for_prompt: false,
                                            itp_support: true,
                                            cancel_on_tap_outside: false,
                                            context: "signin",
                                        });
                                        (
                                            window as any
                                        ).google.accounts.id.disableAutoSelect?.();
                                        return attemptPrompt(false);
                                    } catch (e) {
                                        // fall through
                                    }
                                }

                                setIsPrompting(false);
                                if (typeof window !== "undefined") {
                                    // Helpful diagnostics in dev tools without exposing to users
                                    console.debug("GSI prompt dismissed", {
                                        dismissedReason,
                                        notDisplayedReason,
                                        skippedReason,
                                    });
                                }
                                onError?.(
                                    new Error(
                                        `Google sign-in was closed or blocked${
                                            dismissedReason
                                                ? `: ${dismissedReason}`
                                                : ""
                                        }${
                                            notDisplayedReason
                                                ? ` (${notDisplayedReason})`
                                                : ""
                                        }${
                                            skippedReason
                                                ? ` [${skippedReason}]`
                                                : ""
                                        }. Try again or use email link.`
                                    )
                                );
                            }
                        } catch (e) {
                            if (!gotCredentialRef.current) {
                                setIsPrompting(false);
                                onError?.(e);
                            }
                        }
                    }
                );
            };

            // Defer prompt slightly to avoid clashing with click UI/animations
            requestAnimationFrame(() =>
                requestAnimationFrame(() => attemptPrompt(true))
            );
        } catch (err) {
            setIsPrompting(false);
            onError?.(err);
        }
    };

    return (
        <Button
            onClick={handleClick}
            disabled={!ready || isPrompting}
            variant={"outline"}
            className="flex w-full items-center gap-3 rounded-full px-4 py-2"
        >
            <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-transparent p-1.5">
                {/* Google SVG */}
                <svg
                    viewBox="0 0 533.5 544.3"
                    className="h-5 w-5"
                >
                    <path
                        fill="#4285F4"
                        d="M533.5 278.4c0-18.3-1.5-36-4.4-53.1H272v100.5h146.9c-6.3 34-25.2 62.8-53.7 82v68h86.8c50.8-46.8 79.5-115.9 79.5-197.4z"
                    />
                    <path
                        fill="#34A853"
                        d="M272 544.3c72.7 0 133.7-24.2 178.3-65.7l-86.8-68c-24.2 16.3-55.1 26-91.5 26-70.3 0-129.9-47.5-151.3-111.4H33.9v69.9C78.9 487.4 168.1 544.3 272 544.3z"
                    />
                    <path
                        fill="#FBBC05"
                        d="M120.7 323.5c-5.6-16.9-8.8-34.9-8.8-53.5s3.2-36.6 8.8-53.5V146.6H33.9c-28.1 55.9-28.1 122.8 0 178.7l86.8-69.8z"
                    />
                    <path
                        fill="#EA4335"
                        d="M272 109.1c39.6 0 75.4 13.6 103.6 40.5l77.7-77.7C405.6 24.5 344.6 0 272 0 168.1 0 78.9 56.9 33.9 146.6l86.8 69.5C142.1 156.6 201.7 109.1 272 109.1z"
                    />
                </svg>
            </span>

            <span className="flex-1 text-left">Sign in with Google</span>

            {isPrompting && (
                <span className="ml-2 flex h-5 w-5 flex-none">
                    <svg
                        className="h-4 w-4 animate-spin"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                        />
                    </svg>
                </span>
            )}
        </Button>
    );
}
