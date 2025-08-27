/** @format */

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Github, Globe, Linkedin } from "lucide-react";
import Link from "next/link";

interface TeamMemberProps {
    name: string;
    role: string;
    description: string;
    avatar: string;
    fallback: string;
    links: {
        github?: string;
        portfolio?: string;
        linkedin?: string;
    };
    skills: string[];
}

const teamMembers: TeamMemberProps[] = [
    {
        name: "Michael Fitzgerald",
        role: "Founder & Lead Developer",
        description:
            "Elementary School Teacher, Web Developer, Programmer, Translator (Mandarin → English), D&D Forever DM, Cyclist, 3D Printer, 3D Modeler.",
        avatar: "https://a-z-animals.com/media/2021/04/shutterstock_634628570.jpg",
        fallback: "MF",
        links: {
            github: "https://github.com/mjf1406",
            portfolio: "https://mr-monkey-portfolio.vercel.app/",
        },
        skills: [
            "Next.js",
            "TypeScript",
            "D&D 5e",
            "Teaching",
            "Translation",
            "3D Modeling",
        ],
    },
];

export const TeamSection = () => {
    return (
        <section
            id="team"
            className="section-container py-24 sm:py-32"
        >
            <div className="text-center mb-12">
                <h2 className="text-lg text-primary mb-2 tracking-wider">
                    Team
                </h2>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                    Meet the Developer
                </h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Built by a full-time teacher for the TTRPG community.
                </p>
            </div>

            <div className="grid md:grid-cols-1 lg:grid-cols-1 gap-8 max-w-4xl mx-auto">
                {teamMembers.map((member) => (
                    <Card
                        key={member.name}
                        className="text-center"
                    >
                        <CardHeader>
                            <div className="flex justify-center mb-4">
                                <Avatar className="w-24 h-24">
                                    <AvatarImage
                                        src={member.avatar}
                                        alt={member.name}
                                    />
                                    <AvatarFallback className="text-lg">
                                        {member.fallback}
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                            <CardTitle className="text-2xl">
                                {member.name}
                            </CardTitle>
                            <CardDescription className="text-lg text-primary font-medium">
                                {member.role}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-muted-foreground leading-relaxed">
                                {member.description}
                            </p>

                            <div className="flex flex-wrap justify-center gap-2">
                                {member.skills.map((skill) => (
                                    <Badge
                                        key={skill}
                                        variant="secondary"
                                    >
                                        {skill}
                                    </Badge>
                                ))}
                            </div>

                            <div className="flex justify-center gap-4 pt-4">
                                {member.links.github && (
                                    <Button
                                        asChild
                                        variant="outline"
                                        size="sm"
                                    >
                                        <Link
                                            href={member.links.github}
                                            target="_blank"
                                        >
                                            <Github className="w-4 h-4 mr-2" />
                                            GitHub
                                        </Link>
                                    </Button>
                                )}
                                {member.links.portfolio && (
                                    <Button
                                        asChild
                                        variant="outline"
                                        size="sm"
                                    >
                                        <Link
                                            href={member.links.portfolio}
                                            target="_blank"
                                        >
                                            <Globe className="w-4 h-4 mr-2" />
                                            Portfolio
                                        </Link>
                                    </Button>
                                )}
                                {member.links.linkedin && (
                                    <Button
                                        asChild
                                        variant="outline"
                                        size="sm"
                                    >
                                        <Link
                                            href={member.links.linkedin}
                                            target="_blank"
                                        >
                                            <Linkedin className="w-4 h-4 mr-2" />
                                            LinkedIn
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </section>
    );
};
