/** @format */

import { Webhooks } from "@polar-sh/nextjs";
import type { PolarSubscriptionUpdatedPayload } from "@/lib/polar-webhook-types";
import dbServer from "@/server/db-server";

// Ensure this route is dynamic and not statically generated
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const POST = Webhooks({
    webhookSecret: process.env.POLAR_SUBSCRIPTION_CHANGED_SECRET!,
    onPayload: async (payload) => {
        // Type guard to ensure we're handling the correct webhook type
        if (payload.type !== "subscription.updated") {
            console.warn(`Unexpected webhook type: ${payload.type}`);
            return;
        }
        const subscriptionPayload =
            payload as unknown as PolarSubscriptionUpdatedPayload;

        const type = subscriptionPayload.type;
        const metadata = subscriptionPayload.data.metadata;
        const plan = metadata.plan as "free" | "basic" | "plus" | "pro";
        const user = await dbServer.auth.getUser({
            email: subscriptionPayload.data.customer.email,
        });
        const userId = user?.id;
        // ---------------------------------
        //      Subscription Updated
        // ---------------------------------
        if (
            type === "subscription.updated" ||
            type === "subscription.created" ||
            type === "subscription.uncanceled"
        ) {
            if (userId) {
                dbServer.transact([
                    dbServer.tx.profiles[userId].update({
                        plan: plan as "free" | "basic" | "plus" | "pro",
                        subscriptionPeriodStart: new Date(
                            subscriptionPayload.data.current_period_start
                        ),
                        subscriptionPeriodEnd: new Date(
                            subscriptionPayload.data.current_period_end
                        ),
                        subscriptionCost: subscriptionPayload.data.amount,
                        recurringInterval: subscriptionPayload.data
                            .recurring_interval as "monthly" | "yearly",
                        recurringIntervalCount:
                            subscriptionPayload.data.recurring_interval_count,
                        trialPeriodStart: new Date(
                            subscriptionPayload.data.trial_start
                        ),
                        trialPeriodEnd: new Date(
                            subscriptionPayload.data.trial_end
                        ),
                    }),
                ]);
            }
        }
        // ---------------------------------
        //      Subscription Canceled
        // ---------------------------------
        else if (type === "subscription.canceled") {
            if (userId) {
                dbServer.transact([
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
            }
        }
    },
});
