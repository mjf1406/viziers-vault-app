/** @format */

"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Github, Mail, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const ContactSection = () => {
    return (
        <section
            id="contact"
            className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32"
        >
            <div className="text-center mb-12">
                <h2 className="text-lg text-primary mb-2 tracking-wider">
                    Contact & Support
                </h2>

                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                    Get Help & Provide Feedback
                </h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Have questions about Vizier&apos;s Vault or suggestions for
                    new features? We&apos;d love to hear from you.
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <Card className="text-center">
                    <CardHeader>
                        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                            <Mail className="w-6 h-6 text-primary" />
                        </div>
                        <CardTitle>Get Support</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-4">
                            I&apos;m one person, the sole developer, so I rely
                            on the community to provide support if I am not
                            available. Plesse join the Discord for support.
                        </p>
                        <Button
                            asChild
                            variant="outline"
                            className="w-full"
                        >
                            {/* TODO: Update the Discord join link */}
                            <Link href="#">Join the Discord</Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card className="text-center">
                    <CardHeader>
                        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                            <MessageCircle className="w-6 h-6 text-primary" />
                        </div>
                        <CardTitle>Feedback</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-4">
                            Suggest new features or improvements for future
                            releases via Google Forms (preferred) or Discord.
                        </p>
                        <Button
                            asChild
                            variant="outline"
                            className="w-full mb-2"
                        >
                            {/* TODO: add a google form link here and a join Discord button */}
                            <Link href="mailto:feedback@viziers-vault.com">
                                Send Feedback
                            </Link>
                        </Button>
                        <Button
                            asChild
                            variant="outline"
                            className="w-full"
                        >
                            {/* TODO: Update the Discord join link */}
                            <Link href="#">Join the Discord</Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card className="text-center">
                    <CardHeader>
                        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                            <Github className="w-6 h-6 text-primary" />
                        </div>
                        <CardTitle>Development</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-4">
                            View the source code or contribute to the project.
                            Please note that the project is licnesed under{" "}
                            <Link
                                className="underline"
                                href={
                                    "https://creativecommons.org/licenses/by-nc-sa/4.0/deed.en"
                                }
                            >
                                CC BY-NC-SA 4.0
                            </Link>
                            .
                        </p>
                        <Button
                            asChild
                            variant="outline"
                            className="w-full"
                        >
                            <Link
                                href="https://github.com/mjf1406/viziers-vault-app"
                                target="_blank"
                            >
                                View on GitHub
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </section>
    );
};
