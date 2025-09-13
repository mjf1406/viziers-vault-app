/** @format */

import React from "react";
import { listSectionIndex } from "@/lib/markdown";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from "next/link";
export const dynamic = "force-dynamic";

export default async function DocsHomePage() {
    const items = listSectionIndex("docs");
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">
                    Documentation
                </h1>
                <p className="text-muted-foreground">
                    Guides, tutorials, and reference.
                </p>
            </div>
            <div className="flex items-center gap-2">
                <Input
                    placeholder="Search docs..."
                    aria-label="Search docs"
                />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="no-underline"
                    >
                        <Card className="h-full hover:shadow-md transition-shadow">
                            <CardHeader>
                                <CardTitle className="text-lg">
                                    {item.title}
                                </CardTitle>
                                {item.description ? (
                                    <CardDescription>
                                        {item.description}
                                    </CardDescription>
                                ) : null}
                            </CardHeader>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
