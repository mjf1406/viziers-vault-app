/** @format */

import { BookOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function LoadingPage() {
    return (
        <div className="space-y-6 p-4 xl:p-10 min-h-dvh">
            {/* Header section */}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold flex gap-3 items-center justify-center">
                    <BookOpen />
                    My Spellbooks
                </h1>

                <div className="flex items-center gap-3">
                    {/* Desktop button skeleton */}
                    <Skeleton className="hidden sm:inline-flex h-10 w-[180px] rounded-md" />

                    {/* Mobile FAB skeleton */}
                    <Skeleton className="sm:hidden fixed bottom-12 right-6 z-50 w-12 h-12 rounded-full" />
                </div>
            </div>

            {/* Grid of skeleton cards */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                    <Card
                        key={i}
                        className="hover:shadow-md transition-shadow"
                    >
                        <CardHeader className="relative w-full mx-auto">
                            <div className="flex items-start gap-4">
                                {/* Title skeleton */}
                                <Skeleton className="h-6 flex-1" />

                                {/* Action buttons skeleton */}
                                <div className="flex items-center gap-0.5 shrink-0">
                                    <Skeleton className="w-8 h-8 rounded" />
                                    <Skeleton className="w-8 h-8 rounded" />
                                    <Skeleton className="w-8 h-8 rounded" />
                                    <Skeleton className="w-8 h-8 rounded" />
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent>
                            <div className="space-y-2">
                                {/* Level and class badges */}
                                <div className="flex flex-wrap gap-1">
                                    <Skeleton className="h-5 w-16 rounded-full" />
                                    <Skeleton className="h-5 w-20 rounded-full" />
                                </div>

                                {/* School badges */}
                                <div className="flex flex-wrap gap-1">
                                    <Skeleton className="h-5 w-24 rounded-full" />
                                    <Skeleton className="h-5 w-20 rounded-full" />
                                    <Skeleton className="h-5 w-28 rounded-full" />
                                </div>

                                {/* Created date */}
                                <Skeleton className="h-4 w-48" />

                                {/* Spell count */}
                                <div className="pt-2">
                                    <Skeleton className="h-4 w-32" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
