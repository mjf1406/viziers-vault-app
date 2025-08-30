/** @format */
/* components/PricingSection.tsx */

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
import { Check } from "lucide-react";
import { features } from "@/lib/features";
import { plans, type TierId } from "@/lib/plans";

export const PricingSection = () => {
    const tierOrder: Record<TierId, number> = {
        free: 0,
        basic: 1,
        plus: 2,
        pro: 3,
    };

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
                {plans.map((plan) => {
                    const included = features.filter(
                        (f) => tierOrder[f.minTier] <= tierOrder[plan.id]
                    );

                    return (
                        <Card
                            key={plan.id}
                            className={
                                plan.popular
                                    ? "drop-shadow-xl shadow-black/10 dark:shadow-white/10 border-[1.5px] border-primary lg:scale-[1.1]"
                                    : ""
                            }
                        >
                            <CardHeader>
                                <CardTitle className="pb-2">
                                    {plan.title}
                                </CardTitle>

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
                                    {included.map((f) => (
                                        <span
                                            key={f.id}
                                            className="flex"
                                        >
                                            <Check className="text-primary mr-2" />
                                            <h3>{f.title}</h3>
                                        </span>
                                    ))}
                                </div>
                            </CardContent>

                            <CardFooter className="flex flex-col items-center">
                                <Button
                                    asChild
                                    variant={
                                        plan.popular ? "default" : "secondary"
                                    }
                                    className="w-full"
                                >
                                    <Link href={plan.ctaHref}>
                                        {plan.ctaText}
                                    </Link>
                                </Button>

                                {plan.popular && plan.footnote && (
                                    <p className="w-full text-center text-sm text-muted-foreground mt-2">
                                        {plan.footnote}
                                    </p>
                                )}
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>
        </section>
    );
};
