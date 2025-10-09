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

type PartiesUpsellProps = {
    className?: string;
};

export default function PartiesUpsell({ className }: PartiesUpsellProps) {
    return (
        <div className={cn("w-full flex justify-center", className)}>
            <Card className="max-w-md w-full">
                <CardHeader>
                    <CardTitle>Unlock Parties</CardTitle>
                    <CardDescription>
                        Subscribe to <strong>Basic</strong> to create parties
                        and enable cloud storage and persistence. Save time in
                        the Encounter Generator by selecting pre-made parties
                        instead of inputting it every time.
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
