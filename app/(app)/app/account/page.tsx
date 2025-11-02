/** @format */
/* app/(app)/app/account/page.tsx */

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Check,
    CheckCircle,
    Crown,
    ShieldAlert,
    X,
    Calendar,
    DollarSign,
    RefreshCw,
} from "lucide-react";
import { features, type Feature } from "@/lib/features";
import { plans as allPlans, type Plan, type TierId } from "@/lib/plans";
import { useUser } from "@/hooks/useUser";
import { toast } from "sonner";
import db from "@/lib/db";

export default function AccountPage() {
    const {
        displayName,
        displayEmail,
        avatarSrc,
        plan: userPlanName,
        isLoading,
        error,
        settings,
        signOut,
        data,
    } = useUser();

    // client-side auth state from the client SDK
    const { user } = db.useAuth();
    const [isCanceling, setIsCanceling] = useState(false);

    const normalizeTier = (name?: string): TierId => {
        const v = name?.toLowerCase();
        switch (v) {
            case "premium":
            case "basic":
                return "basic";
            // case "plus":
            //     return "plus";
            // case "pro":
            //     return "pro";
            default:
                return "free";
        }
    };

    const currentTier: TierId = useMemo(
        () => normalizeTier(userPlanName ?? undefined),
        [userPlanName]
    );

    const plans = allPlans;

    // Get subscription info from profile
    const profile = data?.$users?.[0]?.profile;
    const subscriptionInfo = useMemo(() => {
        if (!profile) return null;
        return {
            subscriptionPeriodStart: profile.subscriptionPeriodStart,
            subscriptionPeriodEnd: profile.subscriptionPeriodEnd,
            subscriptionCost: profile.subscriptionCost,
            trialPeriodStart: profile.trialPeriodStart,
            trialPeriodEnd: profile.trialPeriodEnd,
            recurringInterval: profile.recurringInterval,
            recurringIntervalCount: profile.recurringIntervalCount,
        };
    }, [profile]);

    // Determine which end date to display (trial end if trial is active, otherwise period end)
    const displayEndDate = useMemo(() => {
        if (!subscriptionInfo) return null;

        const now = new Date();
        const trialEnd = subscriptionInfo.trialPeriodEnd
            ? new Date(subscriptionInfo.trialPeriodEnd)
            : null;
        const periodEnd = subscriptionInfo.subscriptionPeriodEnd
            ? new Date(subscriptionInfo.subscriptionPeriodEnd)
            : null;

        // If trial exists and hasn't ended yet, show trial end
        if (trialEnd && trialEnd > now) {
            return {
                label: "Trial End",
                date: trialEnd,
            };
        }

        // Otherwise show period end
        if (periodEnd) {
            return {
                label: "Period End",
                date: periodEnd,
            };
        }

        return null;
    }, [subscriptionInfo]);

    const buildCheckoutUrl = () => {
        const baseUrl =
            "https://sandbox-api.polar.sh/v1/checkout-links/polar_cl_d4dWHIBH4EKnnQr4l33lrCR5e4B8RDWIyKsOb4QeKB8/redirect";
        const params = new URLSearchParams();

        if (user?.id) {
            params.append("user-id", user.id);
        }
        if (displayEmail) {
            params.append("customer_email", displayEmail);
        }
        if (displayName) {
            params.append("customer_name", displayName);
        }

        const queryString = params.toString();
        return queryString ? `${baseUrl}?${queryString}` : baseUrl;
    };

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

    const handleCancelSubscription = async () => {
        if (!displayEmail) {
            toast.error("Email not found. Please try again.");
            return;
        }

        setIsCanceling(true);
        try {
            const res = await fetch("/api/polar/cancel-subscription", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: displayEmail }),
            });

            const data = await res.json();

            if (!res.ok) {
                const errorMsg =
                    data.error ||
                    data.details ||
                    "Failed to cancel subscription";
                console.error("Cancel subscription error:", {
                    status: res.status,
                    error: errorMsg,
                    fullResponse: data,
                });
                throw new Error(errorMsg);
            }

            toast.success(
                "Subscription will cancel at the end of your billing period. You'll keep access until then."
            );
            // Refresh the page to update the UI
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } catch (e: any) {
            console.error(e);
            toast.error(
                e.message ||
                    "Could not cancel subscription. Please try again or contact support."
            );
        } finally {
            setIsCanceling(false);
        }
    };

    const tierOrder: Record<TierId, number> = {
        free: 0,
        basic: 1,
        // plus: 2,
        // pro: 3,
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
                        <>
                            <Button
                                variant="outline"
                                onClick={handleOpenBillingPortal}
                                className="gap-2"
                            >
                                <Crown className="h-4 w-4" />
                                Manage subscription
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        variant="destructive"
                                        className="gap-2"
                                        disabled={isCanceling}
                                    >
                                        <X className="h-4 w-4" />
                                        Cancel subscription
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>
                                            Cancel subscription?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Are you sure you want to cancel your
                                            subscription? You will lose access
                                            to premium features at the end of
                                            your current billing period. You can
                                            resubscribe at any time.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>
                                            Keep subscription
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={handleCancelSubscription}
                                            disabled={isCanceling}
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                            {isCanceling
                                                ? "Canceling..."
                                                : "Yes, cancel subscription"}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </>
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
                    {/* Subscription Details */}
                    {subscriptionInfo &&
                        (subscriptionInfo.subscriptionPeriodStart ||
                            subscriptionInfo.subscriptionPeriodEnd ||
                            subscriptionInfo.subscriptionCost ||
                            subscriptionInfo.trialPeriodStart ||
                            subscriptionInfo.trialPeriodEnd ||
                            subscriptionInfo.recurringInterval ||
                            subscriptionInfo.recurringIntervalCount) && (
                            <>
                                <div className="space-y-3">
                                    <h2 className="text-xl font-semibold">
                                        Subscription Details
                                    </h2>
                                    <Card>
                                        <CardContent className="pt-6">
                                            <div className="grid gap-4 md:grid-cols-2">
                                                {displayEndDate && (
                                                    <div className="flex items-start gap-3">
                                                        <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
                                                        <div>
                                                            <p className="text-sm font-medium">
                                                                {
                                                                    displayEndDate.label
                                                                }
                                                            </p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {displayEndDate.date.toLocaleDateString(
                                                                    "en-US",
                                                                    {
                                                                        year: "numeric",
                                                                        month: "long",
                                                                        day: "numeric",
                                                                    }
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                                {subscriptionInfo.subscriptionCost !==
                                                    undefined &&
                                                    subscriptionInfo.subscriptionCost !==
                                                        null && (
                                                        <div className="flex items-start gap-3">
                                                            <DollarSign className="mt-0.5 h-4 w-4 text-muted-foreground" />
                                                            <div>
                                                                <p className="text-sm font-medium">
                                                                    Cost
                                                                </p>
                                                                <p className="text-sm text-muted-foreground">
                                                                    $
                                                                    {(
                                                                        subscriptionInfo.subscriptionCost /
                                                                        100
                                                                    ).toFixed(
                                                                        2
                                                                    )}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}
                                                {subscriptionInfo.recurringInterval && (
                                                    <div className="flex items-start gap-3">
                                                        <RefreshCw className="mt-0.5 h-4 w-4 text-muted-foreground" />
                                                        <div>
                                                            <p className="text-sm font-medium">
                                                                Recurring
                                                                Interval
                                                            </p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {
                                                                    subscriptionInfo.recurringInterval
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                                {subscriptionInfo.recurringIntervalCount !==
                                                    undefined &&
                                                    subscriptionInfo.recurringIntervalCount !==
                                                        null && (
                                                        <div className="flex items-start gap-3">
                                                            <RefreshCw className="mt-0.5 h-4 w-4 text-muted-foreground" />
                                                            <div>
                                                                <p className="text-sm font-medium">
                                                                    Recurring
                                                                    Interval
                                                                    Count
                                                                </p>
                                                                <p className="text-sm text-muted-foreground">
                                                                    {
                                                                        subscriptionInfo.recurringIntervalCount
                                                                    }
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                                <Separator />
                            </>
                        )}

                    <div className="space-y-3">
                        <h2 className="text-xl font-semibold">Your plan</h2>
                        <p className="text-sm text-muted-foreground">
                            Upgrade, downgrade, or manage billing.
                        </p>
                    </div>

                    <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                        {plans.map((p) => (
                            <PlanCard
                                key={p.id}
                                plan={p}
                                isCurrent={p.id === currentTier}
                                onCheckout={() => handleCheckout(p.id)}
                                onManage={handleOpenBillingPortal}
                                allFeatures={features}
                                tierOrder={tierOrder}
                                buildCheckoutUrl={buildCheckoutUrl}
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
    buildCheckoutUrl,
}: {
    plan: Plan;
    isCurrent: boolean;
    onCheckout: () => void;
    onManage: () => void;
    allFeatures: Feature[];
    tierOrder: Record<TierId, number>;
    buildCheckoutUrl: () => string;
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
                {plan.id === "basic" && plan.priceYearly ? (
                    <div className="space-y-1">
                        <div className="flex items-baseline gap-1">
                            <div className="text-3xl font-semibold">
                                ${plan.priceYearly}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                /year
                            </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            ${plan.priceMonthly}/month
                        </div>
                    </div>
                ) : (
                    <div className="flex items-baseline gap-1">
                        <div className="text-3xl font-semibold">
                            ${plan.priceMonthly}
                        </div>
                        <div className="text-sm text-muted-foreground">
                            /month
                        </div>
                    </div>
                )}
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
                    plan.id === "basic" ? (
                        <Button
                            className="w-full"
                            asChild
                        >
                            <Link
                                href={buildCheckoutUrl()}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Get Basic
                            </Link>
                        </Button>
                    ) : (
                        <Button
                            className="w-full"
                            onClick={onCheckout}
                        >
                            {plan.ctaText || "Upgrade"}
                        </Button>
                    )
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
