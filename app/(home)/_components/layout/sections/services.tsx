/** @format */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

enum ProService {
    YES = 1,
    NO = 0,
}
interface ServiceProps {
    title: string;
    pro: ProService;
    description: string;
}
const serviceList: ServiceProps[] = [
    {
        title: "Fully Customizable",
        description:
            "All generator settings, even the ones that are hard to understand, are available for you to customize.",
        pro: 1,
    },
    {
        title: "Access Anywhere",
        description:
            "All things you have ever generated and all of your settings are saved in the cloud for you to use on any computer.",
        pro: 1,
    },
    {
        title: "Feature Voting Power",
        description: "Vote for the next feature on Discord.",
        pro: 1,
    },
    {
        title: "Export & Integration",
        description:
            "Export generated content as CSV files. Link to D&D Beyond, Open 5e, or custom sources for easy reference.",
        pro: 0,
    },
    {
        title: "Party Balance Integration",
        description:
            "Generate encounters automatically balanced for your party's composition and levels.",
        pro: 0,
    },
    {
        title: "VTT Compatibility",
        description:
            "Export battle maps in formats compatible with popular virtual tabletop platforms.",
        pro: 0,
    },
];

export const ServicesSection = () => {
    return (
        <section
            id="services"
            className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32"
        >
            <h2 className="text-lg text-primary text-center mb-2 tracking-wider">
                Features
            </h2>

            <h2 className="text-3xl md:text-4xl text-center font-bold mb-4">
                Vizier&apos;s Vault Capabilities
            </h2>
            <h3 className="md:w-1/2 mx-auto text-xl text-center text-muted-foreground mb-8">
                Features designed to streamline your D&D campaign preparation
                and management.
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"></div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-4 w-full lg:w-[60%] mx-auto">
                {serviceList.map(({ title, description, pro }) => (
                    <Card
                        key={title}
                        className="bg-muted/60 dark:bg-card h-full relative"
                    >
                        <CardHeader>
                            <CardTitle>{title}</CardTitle>
                            <CardDescription>{description}</CardDescription>
                        </CardHeader>
                        <Badge
                            data-pro={ProService.YES === pro}
                            variant="secondary"
                            className="absolute -top-2 -right-3 data-[pro=false]:hidden"
                        >
                            PREMIUM
                        </Badge>
                    </Card>
                ))}
            </div>
        </section>
    );
};
