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
import { createUserProfileIfMissing } from "@/app/(app)/app/login/_actions/createUserProfile";

const GOOGLE_CLIENT_NAME = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_NAME!;
const DEFAULT_FALLBACK = "/app/dashboard";

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
            // ignore
        }
    }
    return null;
}

export default function LoginPage() {
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
        } catch (err: any) {
            console.error("Google sign-in error:", err);
            setError(err?.body?.message || "Google sign-in failed");
            setPendingGoogleProfile(null);
            setIsLoading(false);
        } finally {
            setOauthNonce(uuidv4());
        }
    };

    // When auth arrives and we have pending profile info, call server action
    // which creates a profile only if missing and uploads/links avatar if provided.
    useEffect(() => {
        if (!user?.id || !pendingGoogleProfile) return;
        let cancelled = false;

        const applyProfile = async () => {
            setIsLoading(true);
            await nextPaint();

            const token = (user as any)?.refresh_token;
            if (!token) {
                console.error("Missing refresh_token for server action");
                setIsLoading(false);
                return;
            }

            const info = pendingGoogleProfile;

            try {
                try {
                    const res = await createUserProfileIfMissing({
                        token,
                        name: info.name ?? null,
                        imageUrl: info.picture ?? null,
                    });

                    // res.created === true => we created a profile (and possibly uploaded+linked)
                    // res.created === false => profile already existed; do nothing
                    if (!res || (res as any).created === false) {
                        // nothing to do — do not overwrite existing profile
                        console.debug(
                            "Profile already existed or was not created by action"
                        );
                    }
                } catch (err) {
                    console.error("createUserProfileIfMissing error:", err);
                }
            } finally {
                if (!cancelled) {
                    setPendingGoogleProfile(null);
                    navigateToReturn();
                }
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
