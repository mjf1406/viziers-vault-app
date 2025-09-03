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
import { makeUploadCandidate } from "@/lib/image";
import { uploadImage } from "@/lib/storage";
import { v4 as uuidv4 } from "uuid";
import MagicLinkAuth from "./MagicLinkAuth";

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
 * Accepts:
 *  - relative path starting with "/" (but not protocol-relative "//")
 *  - absolute same-origin URLs => converted to pathname+search+hash
 * Rejects anything that could be an open redirect.
 */
function sanitizeReturnTo(candidate?: string | null): string | null {
    if (!candidate) return null;
    const trimmed = candidate.trim();
    if (!trimmed) return null;
    // disallow CR/LF
    if (/[\n\r]/.test(trimmed)) return null;

    // Accept a single-leading-slash path, e.g. "/foo?bar=baz"
    if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
        return trimmed;
    }

    // Accept same-origin absolute URL, convert to path+search+hash
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

    // helper to read session fallback (safe access)
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

            // If we cannot compute a safe path, try to emulate "back".
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

    // Ensures the overlay paints before heavy async work
    const nextPaint = useCallback(
        () =>
            new Promise<void>((resolve) =>
                requestAnimationFrame(() =>
                    requestAnimationFrame(() => resolve())
                )
            ),
        []
    );

    // Sign in with id token. If profileInfo exists we stash it and wait for the
    // `user` auth state to arrive; the effect below will perform fetch + upload
    // and create/update userProfiles linking the uploaded file.
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

            // If there's no profileInfo to apply, redirect immediately.
            if (!profileInfo) {
                // keep loading until route change; unmount will clear it
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

    // When auth arrives and we have pending profile info, fetch the picture,
    // upload it, then update/create userProfiles and link the uploaded file.
    useEffect(() => {
        if (!user?.id || !pendingGoogleProfile) return;
        let cancelled = false;

        const applyProfile = async () => {
            setIsLoading(true);
            await nextPaint();

            const uid = user.id;
            const info = pendingGoogleProfile;

            let uploadedFileId: string | null = null;

            // 1) fetch & upload avatar (if present)
            if (info.picture) {
                try {
                    const resp = await fetch(info.picture, { mode: "cors" });
                    if (resp.ok) {
                        const blob = await resp.blob();
                        const ext =
                            (blob.type && blob.type.split("/")[1]) || "jpg";
                        const filename = `${uid}-avatar.${ext}`;
                        const file = new File([blob], filename, {
                            type: blob.type || "image/jpeg",
                        });

                        const candidate = await makeUploadCandidate(file);
                        const safeName = (candidate.name || filename).replace(
                            /\s+/g,
                            "-"
                        );
                        const path = `avatars/${uid}-avatar-${Date.now()}-${safeName}`;

                        uploadedFileId = await uploadImage(
                            (candidate as any).blobOrFile ?? file,
                            path,
                            (candidate as any).type
                                ? { contentType: (candidate as any).type }
                                : undefined
                        );

                        console.debug("avatar upload result:", {
                            uploadedFileId,
                            path,
                        });
                    } else {
                        console.warn(
                            "Failed to fetch Google picture:",
                            resp.status
                        );
                    }
                } catch (err) {
                    console.error("Avatar fetch/upload failed:", err);
                }
            }

            // 2) Ensure userProfiles row exists (create if missing)
            try {
                await db.transact(
                    db.tx.userProfiles[uid]
                        .create({
                            joined: new Date(),
                            premium: false,
                        })
                        .link({ $user: uid })
                );
            } catch (err: any) {
                if (!err?.message?.includes?.("Creating entities that exist")) {
                    console.error("Failed to ensure userProfiles row:", err);
                }
            }

            // 3) Update name if provided
            if (info.name) {
                try {
                    await db.transact(
                        db.tx.userProfiles[uid].update({ name: info.name })
                    );
                } catch (err) {
                    console.error("Failed to update profile name:", err);
                }
            }

            // 4) Link avatar
            if (uploadedFileId) {
                try {
                    await db.transact(
                        db.tx.userProfiles[uid]
                            .update({})
                            .link({ $files: uploadedFileId })
                    );
                } catch (err) {
                    console.error("Failed to link avatar to profile:", err);
                }
            }

            if (!cancelled) {
                setPendingGoogleProfile(null);
                navigateToReturn();
            }
            // keep isLoading true for the route change
        };

        void applyProfile();

        return () => {
            cancelled = true;
        };
    }, [user?.id, pendingGoogleProfile, navigateToReturn, nextPaint]);

    // local oauth nonce state
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
                                        if (v) setIsLoading(true); // child only turns it on
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
