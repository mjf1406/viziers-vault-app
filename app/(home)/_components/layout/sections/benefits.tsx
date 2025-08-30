/** @format */
/* components/BenefitsSection.tsx */

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import Link from "next/link";

type Benefit = {
    id: string;
    title: string;
    description: string;
    icon?: string; // lucide-react icon name, e.g., "Clock", "Scale", etc.
};

export const BenefitsSection = () => {
    // Outcome-focused benefits (not tied to features JSON)
    const benefits: Benefit[] = [
        {
            id: "save-prep-time",
            title: "Save Hours of Prep",
            description:
                "Spin up encounters, loot, and maps in minutes so you can spend " +
                "more time on story and play.",
            icon: "Clock",
        },
        {
            id: "balanced-content",
            title: "Balanced, Ready-to-Run Content",
            description:
                "Auto-tuned difficulty and scalable recommendations reduce " +
                "guesswork and keep sessions flowing.",
            icon: "Scale",
        },
        {
            id: "seamless-ux",
            title: "Frictionless Session Flow",
            description:
                "Fast, clean UI and smart defaults minimize clicks and context " +
                "switching during the game.",
            icon: "Sparkles",
        },
        {
            id: "share-and-reuse",
            title: "Share and Reuse Easily",
            description:
                "One-click links and exports let you hand off content to players " +
                "or reuse across campaigns.",
            icon: "Share2",
        },
    ];

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
                        Streamline Your D&amp;D Campaign
                    </h2>
                    <p className="text-xl text-muted-foreground mb-8">
                        Focus on storytelling and player engagement while our
                        tools handle the mechanical aspects of preparation and
                        play.
                    </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-4 w-full">
                    {benefits.map((b, index) => (
                        <Card
                            key={b.id}
                            className="bg-muted/50 dark:bg-card hover:bg-background transition-all delay-75 group/number"
                        >
                            <CardHeader>
                                <div className="flex justify-between">
                                    {b.icon ? (
                                        <Icon
                                            name={b.icon as any}
                                            size={32}
                                            color="hsl(var(--primary))"
                                            className="mb-6 text-primary"
                                        />
                                    ) : (
                                        <span />
                                    )}
                                    <span className="text-5xl text-muted-foreground/15 font-medium transition-all delay-75 group-hover/number:text-muted-foreground/30">
                                        0{index + 1}
                                    </span>
                                </div>

                                <CardTitle>{b.title}</CardTitle>
                            </CardHeader>

                            <CardContent className="text-muted-foreground">
                                {b.description}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            <div className="w-full mx-auto flex justify-center mt-10 space-x-4">
                <Button asChild>
                    <Link href={"/app/account"}>Sign up now</Link>
                </Button>
                <Button
                    variant="outline"
                    asChild
                >
                    <Link href={"/app/dashboard"}>Go to the app</Link>
                </Button>
            </div>
        </section>
    );
};
