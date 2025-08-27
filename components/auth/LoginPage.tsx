/** @format */

"use client";

import React, { useEffect, useState } from "react";
import db from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Mail, Lock, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import GoogleCustomButton from "./GoogleCustomButton";
import { makeUploadCandidate } from "@/lib/image";
import { uploadImage } from "@/lib/storage";
import { v4 as uuidv4 } from "uuid";

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
                        })
                        .link({ $user: user.id })
                );
            } catch (err: any) {
                if (err.message.includes("Creating entities that exist")) {
                    // already created elsewhere — fine
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

export default function LoginPage() {
    useEnsureUserProfile();
    const { user } = db.useAuth();

    const [sentEmail, setSentEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();
    const [oauthNonce, setOauthNonce] = useState<string>(() => uuidv4());

    // pending profile info returned from Google button (name + picture url).
    const [pendingGoogleProfile, setPendingGoogleProfile] = useState<{
        name?: string;
        picture?: string | null;
    } | null>(null);

    const handleSendMagicCode = async (email: string) => {
        setIsLoading(true);
        setError("");

        try {
            await db.auth.sendMagicCode({ email });
            setSentEmail(email);
        } catch (err: any) {
            setError(err?.body?.message || "Failed to send magic code");
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyMagicCode = async (code: string) => {
        setIsLoading(true);
        setError("");

        try {
            await db.auth.signInWithMagicCode({ email: sentEmail, code });
            router.push("/app/dashboard");
        } catch (err: any) {
            console.error("Magic Link Verification error:", err);
            setError(err?.body?.message || "Invalid code");
        } finally {
            setIsLoading(false);
        }
    };

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
            await db.auth.signInWithIdToken({
                clientName: GOOGLE_CLIENT_NAME,
                idToken: credential,
                nonce,
            });

            // If there's no profileInfo to apply, redirect immediately.
            if (!profileInfo) {
                router.push("/app/dashboard");
                setIsLoading(false);
            }
            // otherwise leave isLoading true and let the effect handle completion
        } catch (err: any) {
            console.error("Google sign-in error:", err);
            setError(err?.body?.message || "Google sign-in failed");
            // clear pending profile so it won't be applied accidentally
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

                        // debug: make sure uploadImage returned something sensible
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
                    // proceed without avatar
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
                // ignore "already exists" errors, surface others
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

            // 4) Link avatar in a dedicated transaction (safer)
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
                router.push("/app/dashboard");
            }
            if (!cancelled) setIsLoading(false);
        };

        void applyProfile();

        return () => {
            cancelled = true;
        };
    }, [user?.id, pendingGoogleProfile, router]);

    return (
        <div className="container relative min-h-screen flex-col items-center justify-center flex w-full mx-auto">
            <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                <Card>
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl text-center">
                            Welcome to Vizier's Vault
                        </CardTitle>
                        <CardDescription className="text-center">
                            Sign in to access your account
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        {error && (
                            <div className="p-3 text-sm border border-destructive/50 text-destructive rounded-md bg-destructive/10">
                                {error}
                            </div>
                        )}

                        {!sentEmail ? (
                            <>
                                <div className="w-full flex items-center justify-center google-login-wrapper">
                                    <GoogleCustomButton
                                        clientId={
                                            process.env
                                                .NEXT_PUBLIC_GOOGLE_CLIENT_ID!
                                        }
                                        nonce={oauthNonce}
                                        // GoogleCustomButton now calls onSuccess(idToken, { name?, picture? })
                                        onSuccess={(credential, info) => {
                                            void handleGoogleSignIn(
                                                credential,
                                                oauthNonce,
                                                info ?? null
                                            );
                                        }}
                                        onError={() =>
                                            setError("Google login failed")
                                        }
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

                                <MagicLinkForm
                                    onSendEmail={handleSendMagicCode}
                                    isLoading={isLoading}
                                />
                            </>
                        ) : (
                            <MagicCodeForm
                                sentEmail={sentEmail}
                                onVerifyCode={handleVerifyMagicCode}
                                onBack={() => setSentEmail("")}
                                isLoading={isLoading}
                            />
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function MagicLinkForm({
    onSendEmail,
    isLoading,
}: {
    onSendEmail: (email: string) => void;
    isLoading: boolean;
}) {
    const [email, setEmail] = useState("");

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const trimmed = email.trim();
        if (trimmed) {
            onSendEmail(trimmed);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="grid gap-4"
        >
            <div className="grid gap-2">
                <label
                    htmlFor="email"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                    Email address
                </label>
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                        disabled={isLoading}
                    />
                </div>
            </div>

            <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !email.trim()}
            >
                {isLoading ? "Sending..." : "Send Magic Link"}
            </Button>
        </form>
    );
}

function MagicCodeForm({
    sentEmail,
    onVerifyCode,
    onBack,
    isLoading,
}: {
    sentEmail: string;
    onVerifyCode: (code: string) => void;
    onBack: () => void;
    isLoading: boolean;
}) {
    const [code, setCode] = useState("");

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const trimmed = code.trim();
        if (trimmed) {
            onVerifyCode(trimmed);
        }
    };

    return (
        <div className="grid gap-4">
            <div className="flex items-center space-x-2">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onBack}
                    className="p-0 h-auto"
                >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back
                </Button>
            </div>

            <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">
                    Enter verification code
                </h3>
                <p className="text-sm text-muted-foreground">
                    We sent a code to <strong>{sentEmail}</strong>
                </p>
            </div>

            <form
                onSubmit={handleSubmit}
                className="grid gap-4"
            >
                <div className="grid gap-2">
                    <label
                        htmlFor="code"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                        Verification code
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                            id="code"
                            type="text"
                            placeholder="Enter 6-digit code"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            className="pl-10 text-center text-lg tracking-widest"
                            maxLength={6}
                            required
                            disabled={isLoading}
                            autoFocus
                        />
                    </div>
                </div>

                <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading || code.length !== 6}
                >
                    {isLoading ? "Verifying..." : "Verify Code"}
                </Button>
            </form>
        </div>
    );
}
