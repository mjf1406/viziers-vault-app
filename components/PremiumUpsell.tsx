/** @format */

"use client";

import Link from "next/link";
import { IconCrown, IconShieldStar, IconUsersGroup } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { useUser } from "@/hooks/useUser";

type PremiumUpsellProps = {
    className?: string;
    unlockedItem: string;
};

export default function PremiumUpsell({
    className,
    unlockedItem,
}: PremiumUpsellProps) {
    const { data } = useUser();
    const isLoggedIn = Boolean(data?.$users?.length);

    const ctaHref = isLoggedIn ? "/app/account" : "/app/login";
    const ctaLabel = isLoggedIn
        ? "Subscribe to Premium"
        : "Sign in to subscribe";

    return (
        <Card className={className}>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <IconCrown className="h-6 w-6 text-yellow-500" />
                    <CardTitle>Unlock {unlockedItem} with Premium</CardTitle>
                </div>
                <CardDescription>
                    Create, manage, and share {unlockedItem} across your
                    campaigns. Save unlimited {unlockedItem}, sync across
                    devices, and get priority updates.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col gap-4">
                    <Feature
                        icon={<IconUsersGroup className="h-5 w-5" />}
                        title={`Unlimited ${unlockedItem}`}
                        description="No caps, organize everything in one place."
                    />
                    <Feature
                        icon={<IconShieldStar className="h-5 w-5" />}
                        title="Sync & backup"
                        description="Your data stays safe and accessible."
                    />
                    <Feature
                        icon={<IconCrown className="h-5 w-5" />}
                        title="Premium perks"
                        description="Access to Alpha/Beta builds & voting for the next features on Discord."
                    />
                </div>

                <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
                    <Button
                        asChild
                        size="lg"
                        className="w-full sm:w-auto"
                    >
                        <Link href={ctaHref}>{ctaLabel}</Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

function Feature({
    icon,
    title,
    description,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
}) {
    return (
        <div className="flex items-start gap-3 rounded-md border p-3">
            <div className="mt-0.5 text-muted-foreground">{icon}</div>
            <div>
                <div className="font-medium">{title}</div>
                <div className="text-sm text-muted-foreground">
                    {description}
                </div>
            </div>
        </div>
    );
}
