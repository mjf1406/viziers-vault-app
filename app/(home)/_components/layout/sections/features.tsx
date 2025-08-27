/** @format */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { icons } from "lucide-react";
import { getToolsInOrder } from "@/lib/tools";

export const FeaturesSection = () => {
    const tools = getToolsInOrder();

    // Build a lookup by title so we can link integrations to their tool url
    const toolsByTitle = Object.fromEntries(
        tools.map((t) => [t.title, t])
    ) as Record<string, (typeof tools)[number] | undefined>;

    return (
        <section
            id="features"
            className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32"
        >
            <h2 className="text-lg text-primary text-center mb-2 tracking-wider">
                Tools
            </h2>

            <h2 className="text-3xl md:text-4xl text-center font-bold mb-4">
                D&D 5e Content Generators
            </h2>

            <h3 className="md:w-1/2 mx-auto text-xl text-center text-muted-foreground mb-8">
                Tools for game masters to generate various things in their D&D
                5e 2024 campaigns and then to share with their players.
            </h3>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {tools.map((tool) => (
                    <div key={tool.id}>
                        <Card className="h-full border-0 shadow-none">
                            <CardHeader className="flex justify-center items-center">
                                <div className="bg-primary/20 p-2 rounded-full ring-8 ring-primary/10 mb-4">
                                    <Icon
                                        name={tool.icon as keyof typeof icons}
                                        size={24}
                                        color="var(--primary)"
                                        className="text-primary"
                                    />
                                </div>

                                <div className="flex-1 text-center">
                                    <CardTitle>{tool.title}</CardTitle>
                                    <div className="text-sm text-primary font-medium">
                                        {tool.status}
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="text-muted-foreground text-center">
                                <p className="mb-3">{tool.description}</p>

                                {tool.integrations?.length ? (
                                    <div className="mt-2">
                                        {/* <div className="text-sm font-semibold mb-2">
                                            Integrations
                                        </div> */}

                                        <div className="flex flex-wrap justify-center gap-2">
                                            {tool.integrations.map(
                                                (intName) => {
                                                    const integrated =
                                                        toolsByTitle[intName];

                                                    // If we can resolve the integration to a tool,
                                                    // render a link to it; otherwise render plain text.
                                                    return integrated ? (
                                                        <a
                                                            key={intName}
                                                            href={
                                                                integrated.url
                                                            }
                                                            className="inline-block
                                                         text-xs px-2 py-1
                                                         rounded-full
                                                         bg-muted text-muted-foreground
                                                         hover:underline"
                                                        >
                                                            {intName}
                                                        </a>
                                                    ) : (
                                                        <span
                                                            key={intName}
                                                            className="inline-block
                                                         text-xs px-2 py-1
                                                         rounded-full
                                                         bg-muted text-muted-foreground"
                                                        >
                                                            {intName}
                                                        </span>
                                                    );
                                                }
                                            )}
                                        </div>
                                    </div>
                                ) : null}
                            </CardContent>
                        </Card>
                    </div>
                ))}
            </div>
        </section>
    );
};
