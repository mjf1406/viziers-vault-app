/** @format */

"use client";

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EncounterType } from "@/lib/constants/encounters";

type ProbabilityData = {
    cumulative: Array<{ count: number; probability: number }>;
    byType: Record<EncounterType, Array<{ count: number; probability: number }>>;
};

type EncounterProbabilityDisplayProps = {
    data: ProbabilityData | null;
    isLoading?: boolean;
};

// Placeholder probability calculation
function calculateProbabilities(): ProbabilityData {
    // Placeholder: This will be replaced with actual logic
    const cumulative = [
        { count: 0, probability: 0.3 },
        { count: 1, probability: 0.5 },
        { count: 2, probability: 0.15 },
        { count: 3, probability: 0.05 },
    ];

    const byType = {
        combat: [
            { count: 0, probability: 0.4 },
            { count: 1, probability: 0.4 },
            { count: 2, probability: 0.15 },
            { count: 3, probability: 0.05 },
        ],
        "non-combat": [
            { count: 0, probability: 0.5 },
            { count: 1, probability: 0.35 },
            { count: 2, probability: 0.1 },
            { count: 3, probability: 0.05 },
        ],
        hazard: [
            { count: 0, probability: 0.6 },
            { count: 1, probability: 0.3 },
            { count: 2, probability: 0.08 },
            { count: 3, probability: 0.02 },
        ],
    };

    return { cumulative, byType };
}

export default function EncounterProbabilityDisplay({
    data,
    isLoading = false,
}: EncounterProbabilityDisplayProps) {
    const displayData = data ?? calculateProbabilities();

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Encounter Probabilities</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        Calculating probabilities...
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Encounter Probabilities</CardTitle>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="cumulative" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="cumulative">Cumulative</TabsTrigger>
                        <TabsTrigger value="by-type">By Type</TabsTrigger>
                    </TabsList>

                    <TabsContent value="cumulative" className="space-y-4 mt-4">
                        <div>
                            <h4 className="text-sm font-medium mb-2">
                                Probability of X Encounters
                            </h4>
                            <div className="space-y-2">
                                {displayData.cumulative.map((item) => (
                                    <div
                                        key={item.count}
                                        className="flex items-center gap-3"
                                    >
                                        <div className="w-16 text-sm font-medium">
                                            {item.count}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                                                    <div
                                                        className="bg-primary h-full transition-all"
                                                        style={{
                                                            width: `${item.probability * 100}%`,
                                                        }}
                                                    />
                                                </div>
                                                <div className="w-16 text-sm text-muted-foreground text-right">
                                                    {(item.probability * 100).toFixed(1)}%
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="by-type" className="space-y-6 mt-4">
                        {(Object.entries(displayData.byType) as Array<
                            [EncounterType, typeof displayData.byType[EncounterType]]
                        >).map(([type, data]) => (
                            <div key={type}>
                                <h4 className="text-sm font-medium mb-2 capitalize">
                                    {type.replace("-", " ")} Encounters
                                </h4>
                                <div className="space-y-2">
                                    {data.map((item) => (
                                        <div
                                            key={item.count}
                                            className="flex items-center gap-3"
                                        >
                                            <div className="w-16 text-sm font-medium">
                                                {item.count}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                                                        <div
                                                            className="bg-primary h-full transition-all"
                                                            style={{
                                                                width: `${item.probability * 100}%`,
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="w-16 text-sm text-muted-foreground text-right">
                                                        {(item.probability * 100).toFixed(1)}%
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}




