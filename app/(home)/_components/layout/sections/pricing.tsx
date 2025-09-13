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
import { Check, CheckCircle } from "lucide-react";
import { features } from "@/lib/features";
import { plans, type TierId } from "@/lib/plans";
import { formatEveryDuration } from "@/lib/utils";

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
                        (f) => f.minTier === plan.id
                    );

                    return (
                        <Card
                            key={plan.id}
                            className={[
                                plan.popular
                                    ? "drop-shadow-xl shadow-black/10 dark:shadow-white/10 border-[1.5px] border-primary lg:scale-[1.1] transform-gpu transition-all"
                                    : "",
                            ].join(" ")}
                        >
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2">
                                        {plan.title}
                                    </CardTitle>
                                </div>
                                <CardDescription>
                                    {plan.description}
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                <div className="flex items-baseline gap-1">
                                    <div className="text-3xl font-semibold">
                                        ${plan.priceMonthly}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        /month
                                    </div>
                                </div>

                                <ul className="space-y-2">
                                    {tierOrder[plan.id] > 0 && (
                                        <li className="flex items-start gap-2">
                                            <CheckCircle className="mt-0.5 h-4 w-4 text-green-600" />
                                            <span className="text-sm">
                                                Everything in{" "}
                                                {
                                                    Object.keys(tierOrder)[
                                                        tierOrder[plan.id] - 1
                                                    ]
                                                }{" "}
                                                and...
                                            </span>
                                        </li>
                                    )}

                                    {included.map((f) => (
                                        <li
                                            key={f.id}
                                            className="flex items-start gap-2"
                                        >
                                            <Check className="mt-0.5 h-4 w-4 text-green-600" />
                                            <span className="text-sm">
                                                {f.title}
                                            </span>
                                        </li>
                                    ))}
                                </ul>

                                {plan.rateLimits && (
                                    <div className="pt-4 border-t mt-4">
                                        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                                            Rate limits
                                        </div>
                                        <ul className="text-sm space-y-1">
                                            <li>
                                                Generations:{" "}
                                                {
                                                    plan.rateLimits.generations
                                                        .limit
                                                }{" "}
                                                {formatEveryDuration(
                                                    plan.rateLimits.generations
                                                        .window
                                                )}
                                            </li>
                                            <li>
                                                Party updates:{" "}
                                                {
                                                    plan.rateLimits.partyUpdates
                                                        .limit
                                                }{" "}
                                                {formatEveryDuration(
                                                    plan.rateLimits.partyUpdates
                                                        .window
                                                )}
                                            </li>
                                            <li>
                                                Avatar uploads:{" "}
                                                {
                                                    plan.rateLimits
                                                        .avatarUploads.limit
                                                }{" "}
                                                {formatEveryDuration(
                                                    plan.rateLimits
                                                        .avatarUploads.window
                                                )}
                                            </li>
                                            <li>
                                                API: {plan.rateLimits.api.limit}{" "}
                                                {formatEveryDuration(
                                                    plan.rateLimits.api.window
                                                )}
                                            </li>
                                        </ul>
                                    </div>
                                )}
                            </CardContent>

                            <CardFooter className="flex flex-col w-full gap-2 justify-center items-center">
                                {plan.id === "basic" && (
                                    <Button
                                        className="w-full"
                                        variant={"default"}
                                    >
                                        {plan.ctaText || "Upgrade"}
                                    </Button>
                                )}
                                {plan.id === "free" && (
                                    <Button
                                        className="w-full"
                                        variant="outline"
                                    >
                                        {plan.ctaText}
                                    </Button>
                                )}
                                {plan.id !== "free" && plan.id !== "basic" && (
                                    <Button
                                        className="w-full"
                                        variant="outline"
                                    >
                                        {plan.ctaText}
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>
        </section>
    );
};
