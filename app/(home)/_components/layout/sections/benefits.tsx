/** @format */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { icons } from "lucide-react";

interface BenefitsProps {
    icon: string;
    title: string;
    description: string;
}

const benefitList: BenefitsProps[] = [
    {
        icon: "Clock",
        title: "Save Preparation Time",
        description:
            "Generate balanced encounters, magic shops, and spellbooks in minutes instead of hours of manual preparation.",
    },
    {
        icon: "Shield",
        title: "Balanced Content",
        description:
            "All generated content is automatically balanced for your party's level and composition using D&D 5e 2024 guidelines.",
    },
    {
        icon: "Database",
        title: "Seamless UX",
        description:
            "Instant updates on your end with seamless updates on the server.",
    },
    {
        icon: "Settings",
        title: "Customizable Settings",
        description:
            "Fine-tune generation parameters to match your campaign's tone, difficulty, and world-building requirements.",
    },
];

export const BenefitsSection = () => {
    return (
        <section
            id="benefits"
            className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32"
        >
            <div className="grid lg:grid-cols-2 place-items-center lg:gap-24">
                <div>
                    <h2 className="text-lg text-primary mb-2 tracking-wider">
                        Benefits
                    </h2>

                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        Streamline Your D&D Campaign
                    </h2>
                    <p className="text-xl text-muted-foreground mb-8">
                        Focus on storytelling and player engagement while our
                        tools handle the mechanical aspects of campaign
                        preparation and generation.
                    </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-4 w-full">
                    {benefitList.map(({ icon, title, description }, index) => (
                        <Card
                            key={title}
                            className="bg-muted/50 dark:bg-card hover:bg-background transition-all delay-75 group/number"
                        >
                            <CardHeader>
                                <div className="flex justify-between">
                                    <Icon
                                        name={icon as keyof typeof icons}
                                        size={32}
                                        color="hsl(var(--primary))"
                                        className="mb-6 text-primary"
                                    />
                                    <span className="text-5xl text-muted-foreground/15 font-medium transition-all delay-75 group-hover/number:text-muted-foreground/30">
                                        0{index + 1}
                                    </span>
                                </div>

                                <CardTitle>{title}</CardTitle>
                            </CardHeader>

                            <CardContent className="text-muted-foreground">
                                {description}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
};
