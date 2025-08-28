/** @format */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { icons } from "lucide-react";
import Link from "next/link";

export const NameExplanationSection = () => {
    return (
        <section
            id="name-explanation"
            className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32"
        >
            <div className="text-center mb-12">
                <h2 className="text-lg text-primary mb-2 tracking-wider">
                    About the Name
                </h2>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                    Why "Vizier&apos;s Vault"?
                </h2>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                    The name is an intentional reference to the Vizier card from
                    the{" "}
                    <Link
                        prefetch={false}
                        href="https://www.dndbeyond.com/magic-items/4617-deck-of-many-things"
                        className="underline"
                        rel="noopener noreferrer"
                        target="_blank"
                    >
                        Deck of Many Things
                    </Link>
                    : a card that grants a single truthful answer and practical
                    insight when asked.
                </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
                <Card className="h-full">
                    <CardHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                <Icon
                                    name={"Book" as keyof typeof icons}
                                    size={20}
                                    color="var(--primary)"
                                    className="text-primary"
                                />
                            </div>
                            <CardTitle className="text-xl">Vizier</CardTitle>
                        </div>
                        <p className="text-muted-foreground">
                            A ode to the Vizier card: every generation is an
                            answer.
                        </p>
                    </CardHeader>
                    <CardContent>
                        <div>
                            <h4 className="font-semibold text-sm text-primary mb-1">
                                In Practice
                            </h4>
                            <p className="text-sm text-muted-foreground">
                                The site offers clear, practical information
                                paired with context or guidance for
                                implementation.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="h-full">
                    <CardHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                <Icon
                                    name={"Archive" as keyof typeof icons}
                                    size={20}
                                    color="var(--primary)"
                                    className="text-primary"
                                />
                            </div>
                            <CardTitle className="text-xl">Vault</CardTitle>
                        </div>
                        <p className="text-muted-foreground">
                            With each question, you reach into the vault of
                            tools to grab an answer and then return that now
                            known answer back to the vault for safe-keeping.
                        </p>
                    </CardHeader>
                    <CardContent>
                        <div>
                            <h4 className="font-semibold text-sm text-primary mb-1">
                                In Practice
                            </h4>
                            <p className="text-sm text-muted-foreground">
                                Every answer is stored for future reuse and/or
                                reference.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </section>
    );
};
