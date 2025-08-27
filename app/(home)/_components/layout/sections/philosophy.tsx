/** @format */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { icons } from "lucide-react";
import { getToolsInOrder } from "@/lib/tools";

export const PhilosophySection = () => {
    return (
        <section
            id="philosophy"
            className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32"
        >
            <div className="text-center mb-12">
                <h2 className="text-lg text-primary mb-2 tracking-wider">
                    Philosophy
                </h2>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                    Design Philosophy
                </h2>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                    Each tool in Vizier&apos;s Vault was created to solve a
                    specific problem in D&D campaign preparation. While you can
                    use them for other purposes, these are the main reasons each
                    tool exists and how I envisioned they would be used.
                </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
                {getToolsInOrder().map((tool) => (
                    <Card
                        key={tool.id}
                        className="h-full"
                    >
                        <CardHeader>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                    <Icon
                                        name={tool.icon as keyof typeof icons}
                                        size={20}
                                        color="var(--primary)"
                                        className="text-primary"
                                    />
                                </div>
                                <CardTitle className="text-xl">
                                    {tool.title}
                                </CardTitle>
                            </div>
                            <p className="text-muted-foreground">
                                {tool.description}
                            </p>
                        </CardHeader>
                        <CardContent>
                            <div>
                                <h4 className="font-semibold text-sm text-primary mb-1">
                                    Philosophy
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                    {tool.philosophy}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </section>
    );
};
