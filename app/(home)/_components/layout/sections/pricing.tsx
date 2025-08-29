/** @format */

// components/PricingSection.tsx
/** @format */

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { Check, HelpCircle } from "lucide-react";
import { catalog } from "@/lib/features";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export const PricingSection = () => {
    return (
        <section
            id="pricing"
            className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32"
        >
            <h2 className="text-lg text-primary text-center mb-2 tracking-wider">
                Pricing
            </h2>

            <h2 className="text-3xl md:text-4xl text-center font-bold mb-4">
                Simple, transparent pricing
            </h2>

            <h3 className="md:w-1/2 mx-auto text-xl text-center text-muted-foreground pb-14">
                Choose the plan that fits your D&amp;D campaign needs.
            </h3>

            <div className="grid md:grid-cols-2 gap-8 lg:gap-4 max-w-4xl mx-auto">
                {catalog.plans.map((plan) => (
                    <Card
                        key={plan.id}
                        className={
                            plan.popular
                                ? "drop-shadow-xl shadow-black/10 dark:shadow-white/10 border-[1.5px] border-primary lg:scale-[1.1]"
                                : ""
                        }
                    >
                        <CardHeader>
                            <CardTitle className="pb-2">{plan.title}</CardTitle>

                            <CardDescription className="pb-4">
                                {plan.description}
                            </CardDescription>

                            <div>
                                <span className="text-3xl font-bold">
                                    ${plan.priceMonthly}
                                </span>
                                <span className="text-muted-foreground">
                                    {" "}
                                    /month
                                </span>
                            </div>
                        </CardHeader>

                        <CardContent className="flex">
                            <div className="space-y-4">
                                {plan.bullets.map((bullet, idx) => {
                                    if (bullet.type === "text") {
                                        const isTrialLabel =
                                            bullet.label ===
                                            "Free 4-month trial included";
                                        return (
                                            <span
                                                key={`${plan.id}-text-${idx}`}
                                                className="flex items-center gap-2"
                                            >
                                                <Check className="text-primary mr-2" />
                                                <h3 className="flex items-center gap-2">
                                                    {bullet.label}
                                                    {isTrialLabel && (
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger
                                                                    asChild
                                                                >
                                                                    <button
                                                                        type="button"
                                                                        aria-label="More info about trial length"
                                                                        className="inline-flex items-center justify-center p-1 rounded text-muted-foreground hover:text-foreground"
                                                                    >
                                                                        <HelpCircle className="w-4 h-4" />
                                                                    </button>
                                                                </TooltipTrigger>
                                                                <TooltipContent className="max-w-sm">
                                                                    We know that
                                                                    not all
                                                                    groups play
                                                                    weekly or
                                                                    even every
                                                                    other week.
                                                                    Some groups
                                                                    only play
                                                                    once per
                                                                    month or
                                                                    even less.
                                                                    This 4-month
                                                                    trial
                                                                    ensures you
                                                                    have ample
                                                                    time to
                                                                    really try
                                                                    the app no
                                                                    matter how
                                                                    frequently
                                                                    you and your
                                                                    group play.
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    )}
                                                </h3>
                                            </span>
                                        );
                                    }
                                    const f =
                                        catalog.features[bullet.featureId];
                                    const label =
                                        bullet.labelOverride ?? f.title;
                                    return (
                                        <span
                                            key={f.id}
                                            className="flex"
                                        >
                                            <Check className="text-primary mr-2" />
                                            <h3>{label}</h3>
                                        </span>
                                    );
                                })}
                            </div>
                        </CardContent>

                        <CardFooter className="flex flex-col items-center">
                            <Button
                                asChild
                                variant={plan.popular ? "default" : "secondary"}
                                className="w-full"
                            >
                                <Link href={plan.ctaHref}>{plan.ctaText}</Link>
                            </Button>

                            {plan.popular && plan.footnote && (
                                <p className="w-full text-center text-sm text-muted-foreground mt-2">
                                    {plan.footnote}
                                </p>
                            )}
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </section>
    );
};
