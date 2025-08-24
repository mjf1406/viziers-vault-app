/** @format */

"use client";

import React, { useState } from "react";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
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

// Replace these with your actual Google OAuth credentials
const GOOGLE_CLIENT_ID =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "REPLACE_ME";
const GOOGLE_CLIENT_NAME =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_NAME ?? "REPLACE_ME";

export default function LoginPage() {
    const [sentEmail, setSentEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSendMagicCode = async (email: string) => {
        setIsLoading(true);
        setError("");

        try {
            await db.auth.sendMagicCode({ email });
            setSentEmail(email);
        } catch (err: any) {
            setError(err.body?.message || "Failed to send magic code");
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyMagicCode = async (code: string) => {
        setIsLoading(true);
        setError("");

        try {
            await db.auth.signInWithMagicCode({ email: sentEmail, code });
        } catch (err: any) {
            setError(err.body?.message || "Invalid code");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async (credential: string, nonce: string) => {
        setIsLoading(true);
        setError("");

        try {
            await db.auth.signInWithIdToken({
                clientName: GOOGLE_CLIENT_NAME,
                idToken: credential,
                nonce,
            });
        } catch (err: any) {
            setError(err.body?.message || "Google sign-in failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
            <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
                <div className="absolute inset-0 bg-zinc-900" />
                <div className="relative z-20 flex items-center text-lg font-medium">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-2 h-6 w-6"
                    >
                        <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
                    </svg>
                    Vizier's Vault
                </div>
                <div className="relative z-20 mt-auto">
                    <blockquote className="space-y-2">
                        <p className="text-lg">
                            "This library has saved me countless hours of work
                            and helped me deliver stunning designs to my clients
                            faster than ever before."
                        </p>
                        <footer className="text-sm">Sofia Davis</footer>
                    </blockquote>
                </div>
            </div>
            <div className="lg:p-8">
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
                                    {/* Google OAuth */}
                                    <div className="grid gap-4">
                                        <GoogleOAuthProvider
                                            clientId={GOOGLE_CLIENT_ID}
                                        >
                                            <GoogleLogin
                                                onError={() =>
                                                    setError(
                                                        "Google login failed"
                                                    )
                                                }
                                                onSuccess={({ credential }) => {
                                                    const nonce =
                                                        crypto.randomUUID();
                                                    handleGoogleSignIn(
                                                        credential,
                                                        nonce
                                                    );
                                                }}
                                                theme="outline"
                                                size="large"
                                                text="signin_with"
                                                shape="rectangular"
                                                width="100%"
                                            />
                                        </GoogleOAuthProvider>
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

                                    {/* Magic Link Form */}
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
        if (email.trim()) {
            onSendEmail(email.trim());
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
        if (code.trim()) {
            onVerifyCode(code.trim());
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
