/** @format */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { icons } from "lucide-react";

interface DisclosureItemProps {
    icon: string;
    title: string;
    description: string;
    type: "ai" | "human";
}

const disclosureItems: DisclosureItemProps[] = [
    {
        icon: "Palette",
        title: "UI",
        description:
            "AI was used to help with the UI because I hate coding UI.",
        type: "ai",
    },
    {
        icon: "Brush",
        title: "Art",
        description: "AI was not and will never be used for the art.",
        type: "human",
    },
    {
        icon: "Code",
        title: "Algos",
        description:
            "AI was not and will never be used for the algorithms because I love coding algorithms. Algorithms are my jam!",
        type: "human",
    },
];

export const DisclosureSection = () => {
    return (
        <section
            id="disclosure"
            className="section-container py-24 sm:py-32"
        >
            <div className="text-center mb-12">
                <h2 className="text-lg text-primary mb-2 tracking-wider">
                    Disclosure
                </h2>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                    Development Philosophy
                </h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Transparency about how Vizier&apos;s Vault was built and our
                    commitment to human creativity.
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                {disclosureItems.map((item) => (
                    <Card
                        key={item.title}
                        className="text-center"
                    >
                        <CardHeader>
                            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                <Icon
                                    name={item.icon as keyof typeof icons}
                                    size={24}
                                    color="hsl(var(--primary))"
                                    className="text-primary"
                                />
                            </div>
                            <CardTitle className="flex items-center justify-center gap-2">
                                {item.title}
                                <span
                                    className={`text-xs px-2 py-1 rounded-full ${
                                        item.type === "ai"
                                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                            : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                    }`}
                                >
                                    {item.type === "ai"
                                        ? "AI Assisted"
                                        : "Human Created"}
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">
                                {item.description}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="text-center mt-12">
                <div className="bg-muted/50 rounded-lg p-6 max-w-3xl mx-auto">
                    <h3 className="text-lg font-semibold mb-3">
                        Our Commitment
                    </h3>
                    <p className="text-muted-foreground">
                        We believe in leveraging the best of both worlds: AI for
                        tasks that benefit from automation, while preserving
                        human creativity and expertise for the core elements
                        that make Vizier&apos;s Vault unique. All algorithms,
                        game mechanics, and artistic decisions are made by me, a
                        TTRPG GM and player, and freelancers.
                    </p>
                </div>
            </div>
        </section>
    );
};
