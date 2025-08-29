/** @format */

"use client";

import React, { useCallback, useState } from "react";
import db from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Lock, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
    InputOTPSeparator,
} from "@/components/ui/input-otp";

type Props = {
    onError: (message: string) => void;
    onStartGlobalLoading: () => void; // used for verify step (page overlay)
    onStopGlobalLoading: () => void; // stop overlay on error
};

export default function MagicLinkAuth({
    onError,
    onStartGlobalLoading,
    onStopGlobalLoading,
}: Props) {
    const router = useRouter();

    // local states
    const [email, setEmail] = useState("");
    const [sentEmail, setSentEmail] = useState("");
    const [code, setCode] = useState("");

    const [isSending, setIsSending] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);

    const nextPaint = useCallback(
        () =>
            new Promise<void>((resolve) =>
                requestAnimationFrame(() =>
                    requestAnimationFrame(() => resolve())
                )
            ),
        []
    );

    const handleSend = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const trimmed = email.trim();
        if (!trimmed) return;

        onError("");
        setIsSending(true);
        try {
            await db.auth.sendMagicCode({ email: trimmed });
            setSentEmail(trimmed);
            setCode("");
        } catch (err: any) {
            onError(err?.body?.message || "Failed to send magic code");
        } finally {
            setIsSending(false);
        }
    };

    const handleVerify = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const trimmed = code.trim();
        if (!trimmed || trimmed.length !== 6) return;

        onError("");
        setIsVerifying(true);
        onStartGlobalLoading();
        try {
            await nextPaint(); // ensure overlay paints
            await db.auth.signInWithMagicCode({
                email: sentEmail,
                code: trimmed,
            });
            router.push("/app/dashboard"); // keep overlay until unmount
        } catch (err: any) {
            console.error("Magic Link Verification error:", err);
            onError(err?.body?.message || "Invalid code");
            onStopGlobalLoading();
            setIsVerifying(false);
        }
    };

    // Keep only numeric and max 6 chars
    const handleCodeChange = (val: string) => {
        const digits = val.replace(/\D/g, "").slice(0, 6);
        setCode(digits);
    };

    if (!sentEmail) {
        return (
            <form
                onSubmit={handleSend}
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
                        <Mail className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform" />
                        <Input
                            id="email"
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="pl-10"
                            required
                            disabled={isSending}
                        />
                    </div>
                </div>

                <Button
                    type="submit"
                    className="w-full"
                    disabled={isSending || !email.trim()}
                >
                    {isSending ? "Sending..." : "Send Magic Link"}
                </Button>
            </form>
        );
    }

    return (
        <div className="grid gap-4">
            <div className="flex items-center space-x-2">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                        setSentEmail("");
                        setCode("");
                        setIsVerifying(false);
                        onStopGlobalLoading();
                    }}
                    className="h-auto p-0"
                >
                    <ArrowLeft className="mr-1 h-4 w-4" />
                    Back
                </Button>
            </div>

            <div className="space-y-2 text-center">
                <h3 className="text-lg font-semibold">
                    Enter verification code
                </h3>
                <p className="text-sm text-muted-foreground">
                    We sent a code to <strong>{sentEmail}</strong>
                </p>
            </div>

            <form
                onSubmit={handleVerify}
                className="grid gap-4"
            >
                <div className="grid gap-2">
                    <label
                        htmlFor="code"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                        Verification code
                    </label>
                    <div className="relative flex justify-center">
                        <InputOTP
                            id="code"
                            maxLength={6}
                            value={code}
                            onChange={handleCodeChange}
                            disabled={isVerifying}
                            autoFocus
                            aria-label="6-digit verification code"
                        >
                            <InputOTPGroup>
                                <InputOTPSlot index={0} />
                                <InputOTPSlot index={1} />
                                <InputOTPSlot index={2} />
                                {/* </InputOTPGroup>
                            <InputOTPSeparator />
                            <InputOTPGroup> */}
                                <InputOTPSlot index={3} />
                                <InputOTPSlot index={4} />
                                <InputOTPSlot index={5} />
                            </InputOTPGroup>
                        </InputOTP>
                    </div>
                </div>

                <Button
                    type="submit"
                    className="w-full"
                    disabled={isVerifying || code.trim().length !== 6}
                >
                    {isVerifying ? "Verifying..." : "Verify Code"}
                </Button>
            </form>
        </div>
    );
}
