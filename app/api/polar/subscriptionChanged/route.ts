/** @format */

import { Webhooks } from "@polar-sh/nextjs";
import type { PolarSubscriptionUpdatedPayload } from "@/lib/polar-webhook-types";
import dbServer from "@/server/db-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const POST = Webhooks({
    webhookSecret: process.env.POLAR_SUBSCRIPTION_CHANGED_SECRET!,
    onPayload: async (payload) => {
        const subscriptionPayload =
            payload as unknown as PolarSubscriptionUpdatedPayload;

        const type = subscriptionPayload.type;
        const plan = subscriptionPayload.data.product.name.split(" -")[0] as
            | "free"
            | "basic"
            | "plus"
            | "pro";
        const user = await dbServer.auth.getUser({
            email: subscriptionPayload.data.customer.email,
        });
        const userId = user?.id;
        // ---------------------------------
        //      Subscription Updated
        // ---------------------------------
        if (type === "subscription.updated" || type === "subscription.active") {
            if (userId) {
                // Helper function to convert date strings to Date objects or null
                const toDateOrNull = (
                    dateStr: string | null | undefined
                ): Date | null => {
                    if (!dateStr || dateStr === "") return null;
                    const date = new Date(dateStr);
                    return isNaN(date.getTime()) ? null : date;
                };

                try {
                    const updateData = {
                        plan: plan as "free" | "basic" | "plus" | "pro",
                        subscriptionPeriodStart: toDateOrNull(
                            subscriptionPayload.data.current_period_start
                        ),
                        subscriptionPeriodEnd: toDateOrNull(
                            subscriptionPayload.data.current_period_end
                        ),
                        subscriptionCost:
                            subscriptionPayload.data.amount ?? null,
                        recurringInterval: subscriptionPayload.data
                            .recurring_interval
                            ? (subscriptionPayload.data.recurring_interval as
                                  | "monthly"
                                  | "yearly")
                            : null,
                        recurringIntervalCount:
                            subscriptionPayload.data.recurring_interval_count ??
                            null,
                        trialPeriodStart: toDateOrNull(
                            subscriptionPayload.data.trial_start
                        ),
                        trialPeriodEnd: toDateOrNull(
                            subscriptionPayload.data.trial_end
                        ),
                    };

                    console.log("Updating subscription with data:", {
                        userId,
                        email: user.email,
                        updateData,
                    });

                    await dbServer.transact([
                        dbServer.tx.profiles[userId].update(updateData),
                    ]);
                    console.log("💰 Subscription updated for", user.email);
                } catch (error) {
                    console.error("❌ Error updating subscription:", {
                        userId,
                        email: user.email,
                        error:
                            error instanceof Error
                                ? error.message
                                : String(error),
                        payload: subscriptionPayload.data,
                    });
                    throw error;
                }
            }
        }
        // ---------------------------------
        //      Subscription Canceled
        // ---------------------------------
        else if (type === "subscription.revoked") {
            if (userId) {
                try {
                    await dbServer.transact([
                        dbServer.tx.profiles[userId].update({
                            plan: "free",
                            subscriptionPeriodStart: null,
                            subscriptionPeriodEnd: null,
                            subscriptionCost: null,
                            recurringInterval: null,
                            recurringIntervalCount: null,
                            trialPeriodStart: null,
                            trialPeriodEnd: null,
                        }),
                    ]);
                    console.log("❌ Subscription REVOKED for", user.email);
                } catch (error) {
                    console.error("❌ Error revoking subscription:", {
                        userId,
                        email: user.email,
                        error:
                            error instanceof Error
                                ? error.message
                                : String(error),
                    });
                    throw error;
                }
            }
        }
    },
});
