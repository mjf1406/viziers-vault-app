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
export const dynamic = "force-static";

export default async function BlogHomePage() {
    const items = listSectionIndex("blog");
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Blog</h1>
                <p className="text-muted-foreground">
                    Updates, deep-dives, and product news.
                </p>
            </div>
            <div className="flex items-center gap-2">
                <Input
                    placeholder="Search blog..."
                    aria-label="Search blog"
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
                                <CardDescription>
                                    {item.date ? (
                                        <span className="block text-xs text-muted-foreground mb-1">
                                            {new Date(
                                                item.date
                                            ).toLocaleDateString()}
                                        </span>
                                    ) : null}
                                    {item.description ?? ""}
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
