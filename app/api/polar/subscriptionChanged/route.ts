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
                // Keep ISO strings as-is (InstantDB accepts ISO 8601 strings directly)
                const toDateStringOrNull = (
                    dateStr: string | null | undefined
                ): string | null => {
                    if (!dateStr || dateStr === "") return null;
                    // Validate it's a valid date string
                    const date = new Date(dateStr);
                    return isNaN(date.getTime()) ? null : dateStr;
                };

                // Normalize recurring interval (Polar uses "year", we want "yearly")
                const normalizeRecurringInterval = (
                    interval: string | null | undefined
                ): "monthly" | "yearly" | null => {
                    if (!interval) return null;
                    const normalized = interval.toLowerCase();
                    if (normalized === "year" || normalized === "yearly") {
                        return "yearly";
                    }
                    if (normalized === "month" || normalized === "monthly") {
                        return "monthly";
                    }
                    return normalized as "monthly" | "yearly";
                };

                try {
                    // Debug: Log raw payload values
                    console.log("Raw webhook payload values:", {
                        current_period_start:
                            subscriptionPayload.data.current_period_start,
                        current_period_end:
                            subscriptionPayload.data.current_period_end,
                        trial_start: subscriptionPayload.data.trial_start,
                        trial_end: subscriptionPayload.data.trial_end,
                        recurring_interval:
                            subscriptionPayload.data.recurring_interval,
                        recurring_interval_count:
                            subscriptionPayload.data.recurring_interval_count,
                        amount: subscriptionPayload.data.amount,
                    });

                    const updateData = {
                        plan: plan as "free" | "basic" | "plus" | "pro",
                        subscriptionPeriodStart: toDateStringOrNull(
                            subscriptionPayload.data.current_period_start
                        ),
                        subscriptionPeriodEnd: toDateStringOrNull(
                            subscriptionPayload.data.current_period_end
                        ),
                        subscriptionCost:
                            subscriptionPayload.data.amount ?? null,
                        recurringInterval: normalizeRecurringInterval(
                            subscriptionPayload.data.recurring_interval
                        ),
                        recurringIntervalCount:
                            subscriptionPayload.data.recurring_interval_count ??
                            null,
                        trialPeriodStart: toDateStringOrNull(
                            subscriptionPayload.data.trial_start
                        ),
                        trialPeriodEnd: toDateStringOrNull(
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
