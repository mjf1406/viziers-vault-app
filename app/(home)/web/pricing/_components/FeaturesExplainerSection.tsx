/** @format */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X } from "lucide-react";
import { features } from "@/lib/features";
import { plans, type TierId } from "@/lib/plans";

export const PlanFeaturesSection = () => {
    const tierOrder: Record<TierId, number> = {
        free: 0,
        basic: 1,
        // plus: 2,
        // pro: 3,
    };

    return (
        <section
            id="plan-details"
            className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20"
        >
            <div className="text-center mb-8">
                <h2 className="text-lg text-primary mb-2 tracking-wider">
                    Details
                </h2>
                <h3 className="text-2xl md:text-3xl font-bold">
                    A feature-by-feature breakdown of each plan
                </h3>
                <p className="md:w-1/2 mx-auto text-muted-foreground mt-3">
                    A thorough breakdown of every feature and which plan
                    includes it.
                </p>
            </div>

            {/* <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6"> */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
                {plans.map((plan) => (
                    <Card
                        key={plan.id}
                        className="h-full"
                    >
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>{plan.title}</CardTitle>
                            </div>

                            <div className="text-sm text-muted-foreground mt-1">
                                {plan.description}
                            </div>

                            <div className="mt-4">
                                <div className="text-2xl font-semibold">
                                    ${plan.priceMonthly}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    /month
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-3">
                            <ul className="space-y-2">
                                {features.map((f) => {
                                    const included =
                                        tierOrder[f.minTier] <=
                                        tierOrder[plan.id];

                                    return (
                                        <li
                                            key={f.id}
                                            className="flex items-start gap-3"
                                            aria-hidden={false}
                                        >
                                            {included ? (
                                                <Check className="mt-1 h-4 w-4 text-green-600" />
                                            ) : (
                                                <X className="mt-1 h-4 w-4 text-muted-foreground" />
                                            )}

                                            <div>
                                                <div
                                                    className={
                                                        included
                                                            ? "text-sm font-medium"
                                                            : "text-sm text-muted-foreground"
                                                    }
                                                >
                                                    {f.title}
                                                </div>

                                                {f.description && (
                                                    <div className="text-xs text-muted-foreground max-w-md">
                                                        {f.description}
                                                    </div>
                                                )}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </section>
    );
};
