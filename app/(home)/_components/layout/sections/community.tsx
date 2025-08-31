/** @format */

import DiscordIcon from "@/components/icons/discord-icon";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

export const CommunitySection = () => {
    return (
        <section
            id="community"
            className="py-12 "
        >
            <hr className="border-secondary" />
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-20">
                <div className="lg:w-[60%] mx-auto">
                    <Card className="bg-background border-none shadow-none text-center flex flex-col items-center justify-center">
                        <CardHeader>
                            <CardTitle className="text-4xl md:text-5xl font-bold flex flex-col items-center">
                                <DiscordIcon />
                                <div>
                                    Join the
                                    <span className="text-transparent pl-2 bg-gradient-to-r from-[#D247BF] to-primary bg-clip-text">
                                        Vizier Vault Community
                                    </span>
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="lg:w-[80%] text-xl text-muted-foreground">
                            Connect with fellow D&D enthusiasts, share campaign
                            stories, get help with Vizier&apos;s Vault tools,
                            and discover new ways to enhance your tabletop
                            gaming experience.
                        </CardContent>

                        <CardFooter>
                            <Button asChild>
                                <a
                                    href="https://discord.gg/yh7eZq62"
                                    rel="noopener noreferrer"
                                    target="_blank"
                                >
                                    Join the Discord
                                </a>
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
            <hr className="border-secondary" />
        </section>
    );
};
