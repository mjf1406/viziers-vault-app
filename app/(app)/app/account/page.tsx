/** @format */
/* app/(app)/app/account/page.tsx */

"use client";

import { useMemo, useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Check, CheckCircle, Crown, ShieldAlert } from "lucide-react";
import { features, type Feature } from "@/lib/features";
import { plans as allPlans, type Plan, type TierId } from "@/lib/plans";
import { useUser } from "@/hooks/useUser";
import { toast } from "sonner";
import db from "@/lib/db";
import { updateUserProfile } from "@/server/_actions/updateUserProfile";
import { updateUserAvatarFromForm } from "@/server/_actions/updateUserAvatar";

export default function AccountPage() {
    const {
        displayName,
        displayEmail,
        avatarSrc,
        plan: userPlanName,
        isLoading,
        error,
        signOut,
    } = useUser();

    // get refresh token for server actions
    const { user } = db.useAuth();
    const refreshToken = (user as any)?.refresh_token as string | undefined;

    const [nameInput, setNameInput] = useState<string | undefined>(displayName);
    const [nameLoading, setNameLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        setNameInput(displayName);
    }, [displayName]);

    const normalizeTier = (name?: string): TierId => {
        const v = name?.toLowerCase();
        switch (v) {
            case "premium":
            case "basic":
                return "basic";
            case "plus":
                return "plus";
            case "pro":
                return "pro";
            default:
                return "free";
        }
    };

    const currentTier: TierId = useMemo(
        () => normalizeTier(userPlanName ?? undefined),
        [userPlanName]
    );

    const plans = allPlans;

    const handleOpenBillingPortal = async () => {
        try {
            const res = await fetch("/api/billing/portal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });
            if (!res.ok) throw new Error("Failed to open billing portal");
            const { url } = (await res.json()) as { url: string };
            window.location.href = url;
        } catch (e) {
            console.error(e);
            toast.error(
                "Could not open billing portal. Please try again or contact support."
            );
        }
    };

    const handleCheckout = async (tierId: TierId) => {
        try {
            const res = await fetch("/api/billing/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tierId }),
            });
            if (!res.ok) throw new Error("Failed to start checkout");
            const { url } = (await res.json()) as { url: string };
            window.location.href = url;
        } catch (e) {
            console.error(e);
            alert("Could not start checkout. Please try again later.");
        }
    };

    const tierOrder: Record<TierId, number> = {
        free: 0,
        basic: 1,
        plus: 2,
        pro: 3,
    };

    // Avatar upload handler — calls server action with FormData
    const handleAvatarSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!refreshToken) {
            toast.error("Missing auth token. Please refresh and try again.");
            return;
        }

        const form = e.currentTarget;
        const fileInput = form.elements.namedItem("avatar") as HTMLInputElement;
        const file = fileInput?.files?.[0];
        if (!file) {
            toast.error("Please select an image to upload.");
            return;
        }

        setUploading(true);
        try {
            const fd = new FormData();
            fd.append("avatar", file);
            fd.append("token", refreshToken);
            const res = await updateUserAvatarFromForm(fd);
            if (res?.success) {
                toast.success("Avatar updated");
            } else {
                toast.error(res?.error || "Failed to update avatar");
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to upload avatar");
        } finally {
            setUploading(false);
        }
    };

    const handleUpdateName = async () => {
        if (!refreshToken) {
            toast.error("Missing auth token. Please refresh and try again.");
            return;
        }
        setNameLoading(true);
        try {
            const res = await updateUserProfile({
                token: refreshToken,
                name: nameInput ?? null,
            });
            if (res?.success) {
                toast.success("Profile updated");
            } else {
                toast.error(res?.error || "Failed to update profile");
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to update profile");
        } finally {
            setNameLoading(false);
        }
    };

    return (
        <div className="mx-auto w-full max-w-5xl space-y-8 p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                    <Avatar className="h-24 w-24">
                        {avatarSrc ? (
                            <AvatarImage
                                src={avatarSrc}
                                alt={displayName || "Avatar"}
                            />
                        ) : (
                            <AvatarFallback>
                                {displayName?.slice(0, 2)?.toUpperCase() ??
                                    "AC"}
                            </AvatarFallback>
                        )}
                    </Avatar>
                    <div className="text-left">
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-semibold">
                                {displayName}
                            </h1>
                            <Badge
                                variant="secondary"
                                className="capitalize"
                            >
                                {currentTier}
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {displayEmail}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {currentTier !== "free" ? (
                        <Button
                            variant="outline"
                            onClick={handleOpenBillingPortal}
                            className="gap-2"
                        >
                            <Crown className="h-4 w-4" />
                            Manage subscription
                        </Button>
                    ) : null}
                    <Button
                        variant="ghost"
                        onClick={signOut}
                    >
                        Sign out
                    </Button>
                </div>
            </div>

            <Separator />

            {isLoading ? (
                <div className="grid gap-6 md:grid-cols-2">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            ) : error ? (
                <Alert variant="destructive">
                    <ShieldAlert className="h-4 w-4" />
                    <AlertTitle>Couldn’t load your account</AlertTitle>
                    <AlertDescription>
                        Please refresh the page. If the issue persists, contact
                        support.
                    </AlertDescription>
                </Alert>
            ) : (
                <>
                    {/* Profile edit card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile</CardTitle>
                            <CardDescription>
                                Update display name and avatar
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4">
                                <Avatar className="h-16 w-16">
                                    {avatarSrc ? (
                                        <AvatarImage
                                            src={avatarSrc}
                                            alt={displayName || "Avatar"}
                                        />
                                    ) : (
                                        <AvatarFallback>
                                            {displayName
                                                ?.slice(0, 2)
                                                ?.toUpperCase() ?? "AC"}
                                        </AvatarFallback>
                                    )}
                                </Avatar>

                                <form
                                    onSubmit={handleAvatarSubmit}
                                    className="flex items-center gap-2"
                                >
                                    <input
                                        name="avatar"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        id="avatar-file-input"
                                    />
                                    <label htmlFor="avatar-file-input">
                                        <Button
                                            type="button"
                                            onClick={() => {
                                                const el =
                                                    document.getElementById(
                                                        "avatar-file-input"
                                                    ) as HTMLInputElement | null;
                                                el?.click();
                                            }}
                                        >
                                            Choose image
                                        </Button>
                                    </label>
                                    <Button
                                        type="submit"
                                        disabled={!refreshToken || uploading}
                                    >
                                        {uploading
                                            ? "Uploading..."
                                            : "Upload avatar"}
                                    </Button>
                                </form>
                            </div>

                            <div className="mt-4 flex items-center gap-2">
                                <input
                                    className="rounded-md border px-3 py-2"
                                    value={nameInput ?? ""}
                                    onChange={(e) =>
                                        setNameInput(e.target.value)
                                    }
                                    placeholder="Display name"
                                />
                                <Button
                                    onClick={handleUpdateName}
                                    disabled={!refreshToken || nameLoading}
                                >
                                    {nameLoading ? "Saving..." : "Save"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-3">
                        <h2 className="text-xl font-semibold">Your plan</h2>
                        <p className="text-sm text-muted-foreground">
                            Upgrade, downgrade, or manage billing.
                        </p>
                    </div>

                    <div className="grid gap-6 grid-cols-2">
                        {plans.map((p) => (
                            <PlanCard
                                key={p.id}
                                plan={p}
                                isCurrent={p.id === currentTier}
                                onCheckout={() => handleCheckout(p.id)}
                                onManage={handleOpenBillingPortal}
                                allFeatures={features}
                                tierOrder={tierOrder}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

function PlanCard({
    plan,
    isCurrent,
    onCheckout,
    onManage,
    allFeatures,
    tierOrder,
}: {
    plan: Plan;
    isCurrent: boolean;
    onCheckout: () => void;
    onManage: () => void;
    allFeatures: Feature[];
    tierOrder: Record<TierId, number>;
}) {
    const isPaid = plan.id !== "free";
    const included = allFeatures.filter((i) => i.minTier == plan.id);
    const prevTierIndex =
        tierOrder[plan.id] > 0 ? tierOrder[plan.id] - 1 : null;
    const prevTier =
        prevTierIndex !== null ? Object.keys(tierOrder)[prevTierIndex] : null;

    return (
        <Card
            className={[
                plan.popular ? "border-primary" : "",
                isCurrent ? "ring-1 ring-offset-1 ring-primary/20" : "",
            ].join(" ")}
        >
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        {plan.title}
                        {isCurrent ? (
                            <Badge variant="secondary">My plan</Badge>
                        ) : null}
                    </CardTitle>
                </div>
                <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-baseline gap-1">
                    <div className="text-3xl font-semibold">
                        ${plan.priceMonthly}
                    </div>
                    <div className="text-sm text-muted-foreground">/month</div>
                </div>
                <ul className="space-y-2">
                    {prevTier && (
                        <li className="flex items-start gap-2">
                            <CheckCircle className="mt-0.5 h-4 w-4 text-green-600" />
                            <span className="text-sm">
                                Everything in {prevTier} and...
                            </span>
                        </li>
                    )}
                    {included.map((f) => (
                        <li
                            key={f.id}
                            className="flex items-start gap-2"
                        >
                            <Check className="mt-0.5 h-4 w-4 text-green-600" />
                            <span className="text-sm">{f.title}</span>
                        </li>
                    ))}
                </ul>
                {plan.footnote ? (
                    <p className="text-xs text-muted-foreground">
                        {plan.footnote}
                    </p>
                ) : null}
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
                {isCurrent ? (
                    isPaid ? (
                        <Button
                            className="w-full"
                            onClick={onManage}
                        >
                            Manage billing
                        </Button>
                    ) : (
                        <Button
                            className="w-full"
                            variant="secondary"
                            disabled
                        >
                            Current plan
                        </Button>
                    )
                ) : isPaid ? (
                    <Button
                        className="w-full"
                        onClick={onCheckout}
                    >
                        {plan.ctaText || "Upgrade"}
                    </Button>
                ) : (
                    <Button
                        className="w-full"
                        variant="outline"
                        onClick={onCheckout}
                    >
                        Switch to Free
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}
