/** @format */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { icons } from "lucide-react";
import { getToolsInOrder } from "@/lib/tools";

export const FeaturesSection = () => {
    return (
        <section
            id="features"
            className="section-container py-24 sm:py-32"
        >
            <div className="max-w-6xl mx-auto">
                <h2 className="text-lg text-primary text-center mb-2 tracking-wider">
                    Tools
                </h2>

                <h2 className="text-3xl md:text-4xl text-center font-bold mb-4">
                    D&D 5e Content Generators
                </h2>

                <h3 className="md:w-1/2 mx-auto text-xl text-center text-muted-foreground mb-8">
                    Tools for game masters to generate various things in their
                    D&D 5e 2024 campaigns and then to share with their players.
                </h3>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getToolsInOrder().map((tool) => (
                        <div key={tool.id}>
                            <Card className="h-full">
                                <CardHeader className="flex justify-center items-center">
                                    <div className="bg-primary/20 p-2 rounded-full ring-8 ring-primary/10 mb-4">
                                        <Icon
                                            name={
                                                tool.icon as keyof typeof icons
                                            }
                                            size={24}
                                            color="var(--primary)"
                                            className="text-primary"
                                        />
                                    </div>

                                    <CardTitle>{tool.title}</CardTitle>
                                    <div className="text-sm text-primary font-medium">
                                        {tool.status}
                                    </div>
                                </CardHeader>

                                <CardContent className="text-muted-foreground text-center">
                                    {tool.description}
                                </CardContent>
                            </Card>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
