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
            className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32"
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
                                    color="var(--primary)"
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
        </section>
    );
};
