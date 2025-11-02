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
                dbServer.transact([
                    dbServer.tx.profiles[userId].update({
                        plan: plan as "free" | "basic" | "plus" | "pro",
                        subscriptionPeriodStart:
                            subscriptionPayload.data.current_period_start,
                        subscriptionPeriodEnd:
                            subscriptionPayload.data.current_period_end,
                        subscriptionCost: subscriptionPayload.data.amount,
                        recurringInterval: subscriptionPayload.data
                            .recurring_interval as "monthly" | "yearly",
                        recurringIntervalCount:
                            subscriptionPayload.data.recurring_interval_count,
                        trialPeriodStart: subscriptionPayload.data.trial_start,

                        trialPeriodEnd: subscriptionPayload.data.trial_end,
                    }),
                ]);
                console.log("💰 Subscription updated for", user.email);
            }
        }
        // ---------------------------------
        //      Subscription Canceled
        // ---------------------------------
        else if (type === "subscription.revoked") {
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
                console.log("❌ Subscription REVOKED for", user.email);
            }
        }
    },
});
