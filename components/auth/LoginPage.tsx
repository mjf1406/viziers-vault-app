/** @format */
// components\auth\LoginPage.tsx
"use client";

import React, { useCallback, useEffect, useState } from "react";
import db from "@/lib/db";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import GoogleCustomButton from "./GoogleCustomButton";
import { v4 as uuidv4 } from "uuid";
import MagicLinkAuth from "./MagicLinkAuth";
import { updateUserAvatarFromUrl } from "@/server/_actions/updateUserAvatar";
import { updateUserProfile } from "@/server/_actions/updateUserProfile";

function useEnsureUserProfile() {
    const { user } = db.useAuth();

    useEffect(() => {
        if (!user?.id) return;

        const rowId = user.id;

        const createProfile = async () => {
            try {
                await db.transact(
                    db.tx.userProfiles[rowId]
                        .create({
                            joined: new Date(),
                            premium: false,
                            plan: "free",
                        })
                        .link({ $user: user.id })
                );
            } catch (err: any) {
                if (err.message.includes("Creating entities that exist")) {
                    console.warn(err);
                } else {
                    console.error(
                        "useEnsureUserProfile: create profile error:",
                        err
                    );
                    throw err;
                }
            }
        };

        void createProfile();
    }, [user?.id]);
}

const GOOGLE_CLIENT_NAME = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_NAME!;
const DEFAULT_FALLBACK = "/app/dashboard";

/**
 * Return a safe, same-origin path for redirecting.
 */
function sanitizeReturnTo(candidate?: string | null): string | null {
    if (!candidate) return null;
    const trimmed = candidate.trim();
    if (!trimmed) return null;
    if (/[\n\r]/.test(trimmed)) return null;
    if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
        return trimmed;
    }
    if (typeof window !== "undefined") {
        try {
            const parsed = new URL(trimmed);
            if (parsed.origin === window.location.origin) {
                return parsed.pathname + parsed.search + parsed.hash;
            }
        } catch {
            // not a valid absolute URL — reject
        }
    }
    return null;
}

export default function LoginPage() {
    useEnsureUserProfile();
    const { user } = db.useAuth();

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();
    const searchParams = useSearchParams();
    const rawReturnTo = searchParams?.get("returnTo") ?? null;

    const getSessionReturn = () => {
        if (typeof window === "undefined") return null;
        try {
            return sessionStorage.getItem("preLoginPath");
        } catch {
            return null;
        }
    };

    const getSafeDestination = useCallback(
        (override?: string | null) => {
            const candidates = [override, rawReturnTo, getSessionReturn()];
            for (const c of candidates) {
                const safe = sanitizeReturnTo(c ?? null);
                if (safe) return safe;
            }
            return null;
        },
        [rawReturnTo]
    );

    const navigateToReturn = useCallback(
        (override?: string | null) => {
            const dest = getSafeDestination(override);
            if (dest) {
                void router.push(dest);
                return;
            }
            if (typeof window !== "undefined" && window.history.length > 1) {
                router.back();
                return;
            }
            void router.push(DEFAULT_FALLBACK);
        },
        [getSafeDestination, router]
    );

    // pending profile info returned from Google button (name + picture url).
    const [pendingGoogleProfile, setPendingGoogleProfile] = useState<{
        name?: string;
        picture?: string | null;
    } | null>(null);

    const nextPaint = useCallback(
        () =>
            new Promise<void>((resolve) =>
                requestAnimationFrame(() =>
                    requestAnimationFrame(() => resolve())
                )
            ),
        []
    );

    const handleGoogleSignIn = async (
        credential: string,
        nonce: string,
        profileInfo?: { name?: string; picture?: string | null } | null
    ) => {
        setIsLoading(true);
        setError("");
        if (profileInfo) setPendingGoogleProfile(profileInfo);

        try {
            await nextPaint();
            await db.auth.signInWithIdToken({
                clientName: GOOGLE_CLIENT_NAME,
                idToken: credential,
                nonce,
            });

            if (!profileInfo) {
                navigateToReturn();
                return;
            }
            // otherwise leave isLoading true and let the effect handle completion
        } catch (err: any) {
            console.error("Google sign-in error:", err);
            setError(err?.body?.message || "Google sign-in failed");
            setPendingGoogleProfile(null);
            setIsLoading(false);
        } finally {
            setOauthNonce(uuidv4());
        }
    };

    // When auth arrives and we have pending profile info, call server actions
    useEffect(() => {
        if (!user?.id || !pendingGoogleProfile) return;
        let cancelled = false;

        const applyProfile = async () => {
            setIsLoading(true);
            await nextPaint();

            const token = (user as any)?.refresh_token;
            if (!token) {
                console.error("Missing refresh_token for server actions");
                setIsLoading(false);
                return;
            }

            const info = pendingGoogleProfile;

            try {
                // 1) Avatar (from URL) — server action will fetch, upload, and link
                if (info.picture) {
                    try {
                        const avatarRes = await updateUserAvatarFromUrl({
                            token,
                            imageUrl: info.picture,
                            fileName: `${user.id}-avatar`,
                        });
                        if (!avatarRes?.success) {
                            console.warn(
                                "updateUserAvatarFromUrl failed",
                                avatarRes
                            );
                        }
                    } catch (err) {
                        console.error("updateUserAvatarFromUrl error:", err);
                    }
                }

                // 2) Name update
                if (info.name) {
                    try {
                        const profileRes = await updateUserProfile({
                            token,
                            name: info.name,
                        });
                        if (!profileRes?.success) {
                            console.warn(
                                "updateUserProfile failed",
                                profileRes
                            );
                        }
                    } catch (err) {
                        console.error("updateUserProfile error:", err);
                    }
                }
            } finally {
                if (!cancelled) {
                    setPendingGoogleProfile(null);
                    navigateToReturn();
                }
                // keep isLoading true for the route change; if we didn't navigate
                // make sure we stop loading
                if (cancelled) setIsLoading(false);
            }
        };

        void applyProfile();

        return () => {
            cancelled = true;
        };
    }, [user?.id, pendingGoogleProfile, navigateToReturn, nextPaint]);

    const [oauthNonce, setOauthNonce] = useState<string>(() => uuidv4());

    return (
        <div className="relative flex min-h-screen w-full flex-col items-center justify-center">
            {isLoading && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-background/70 backdrop-blur-sm"
                    role="status"
                    aria-live="polite"
                    aria-label="Signing in"
                >
                    <div className="flex flex-col items-center gap-4">
                        <Loader2
                            className="animate-spin"
                            size={72}
                        />
                        <span className="font-medium">Signing in...</span>
                    </div>
                </div>
            )}

            <div className="container mx-auto flex w-full flex-col justify-center">
                <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                    <Card
                        className="relative"
                        aria-busy={isLoading}
                    >
                        <CardHeader className="space-y-1">
                            <CardTitle className="text-center text-2xl">
                                Welcome to Vizier&apos;s Vault
                            </CardTitle>
                            <CardDescription className="text-center">
                                Sign in to access your account
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            {error && (
                                <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                                    {error}
                                </div>
                            )}

                            <div className="google-login-wrapper flex w-full items-center justify-center">
                                <GoogleCustomButton
                                    clientId={
                                        process.env
                                            .NEXT_PUBLIC_GOOGLE_CLIENT_ID!
                                    }
                                    nonce={oauthNonce}
                                    onLoadingChange={(v) => {
                                        if (v) setIsLoading(true);
                                    }}
                                    onSuccess={(credential, info) => {
                                        void handleGoogleSignIn(
                                            credential,
                                            oauthNonce,
                                            info ?? null
                                        );
                                    }}
                                    onError={(e) => {
                                        setIsLoading(false);
                                        setError(
                                            e?.message || "Google login failed"
                                        );
                                    }}
                                />
                            </div>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <Separator className="w-full" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">
                                        Or continue with
                                    </span>
                                </div>
                            </div>

                            <MagicLinkAuth
                                onError={(msg) => setError(msg)}
                                onStartGlobalLoading={() => setIsLoading(true)}
                                onStopGlobalLoading={() => setIsLoading(false)}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
