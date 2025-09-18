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
import { BookOpen } from "lucide-react";

type SpellbookUpsellProps = {
    className?: string;
};

export default function SpellbookUpsell({ className }: SpellbookUpsellProps) {
    return (
        <div className={cn("w-full flex justify-center", className)}>
            <Card className="max-w-md w-full">
                <CardHeader>
                    <CardTitle>Unlock Spellbook Cloud Features</CardTitle>
                    <CardDescription>
                        Subscribe to <strong>Basic</strong> to enable cloud
                        storage and persistent, shareable URLs for your
                        generated spellbooks.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex w-full mx-auto justify-center items-center">
                    <BookOpen className="text-muted-foreground w-20 h-20" />
                </CardContent>
                <CardFooter>
                    <Button
                        asChild
                        variant={"secondary"}
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
