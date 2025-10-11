/** @format */

"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Users } from "lucide-react";

type SettingsUpsellProps = {
    className?: string;
};

export default function SettingsUpsell({ className }: SettingsUpsellProps) {
    return (
        <div className={cn("w-full flex justify-center", className)}>
            <Card className="max-w-xl w-full">
                <CardHeader>
                    <CardTitle>Unlock Settings</CardTitle>
                    <CardDescription>
                        Subscribe to <strong>Basic</strong> to enable cloud
                        storage, persistence, and advanced settings. Save time
                        by syncing your preferences across devices.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex w-full mx-auto justify-center items-center">
                    <Users className="text-muted-foreground w-20 h-20" />
                </CardContent>
                <CardFooter>
                    <Button
                        asChild
                        variant={"default"}
                        className="w-full"
                    >
                        <Link href="/app/pricing?plan=basic">
                            Upgrade to Basic
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
