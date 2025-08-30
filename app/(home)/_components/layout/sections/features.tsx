/** @format */
/* components/ServicesSection.tsx */

import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { features } from "@/lib/features";

const serviceCardFeatureIds = [
    "customizable-settings",
    "permalinks",
    "image-export",
    "vtt-export",
    "csv-export",
    "custom-worlds-and-cities",
];

export const FeaturesSection = () => {
    const cards = serviceCardFeatureIds
        .map((id) => features.find((f) => f.id === id))
        .filter((f): f is NonNullable<typeof f> => Boolean(f));

    return (
        <section
            id="services"
            className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32"
        >
            <h2 className="text-lg text-primary text-center mb-2 tracking-wider">
                Features
            </h2>

            <h2 className="text-3xl md:text-4xl text-center font-bold mb-4">
                Vizier&apos;s Vault Capabilities
            </h2>
            <h3 className="md:w-1/2 mx-auto text-xl text-center text-muted-foreground mb-8">
                Features designed to streamline your D&amp;D campaign
                preparation and management.
            </h3>

            <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-4 w-full lg:w-[60%] mx-auto">
                {cards.map((f) => {
                    const isPremiumOrHigher = f.minTier !== "free";
                    return (
                        <Card
                            key={f.id}
                            className="bg-muted/60 dark:bg-card h-full relative"
                        >
                            <CardHeader>
                                <CardTitle>{f.title}</CardTitle>
                                <CardDescription>
                                    {f.description}
                                </CardDescription>
                            </CardHeader>

                            <Badge
                                data-pro={f.minTier}
                                variant="secondary"
                                className="absolute -top-2 -right-3 data-[pro=false]:hidden"
                            >
                                {f.minTier.toUpperCase()}
                            </Badge>
                        </Card>
                    );
                })}
            </div>
        </section>
    );
};
