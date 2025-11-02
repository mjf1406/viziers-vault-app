/** @format */

import { Webhooks } from "@polar-sh/nextjs";
import type { PolarSubscriptionUpdatedPayload } from "@/lib/polar-webhook-types";
import dbServer from "@/server/db-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const POST = Webhooks({
    webhookSecret: process.env.POLAR_SUBSCRIPTION_CHANGED_SECRET!,
    onPayload: async (payload) => {
        // Debug: Log the entire raw payload to see its structure
        console.log("Full webhook payload:", JSON.stringify(payload, null, 2));

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
                    // Access the data directly - it might be nested differently
                    const subscriptionData = subscriptionPayload.data;

                    // Debug: Log the data object structure
                    console.log(
                        "subscriptionPayload.data keys:",
                        Object.keys(subscriptionData || {})
                    );
                    console.log(
                        "Has current_period_start?",
                        "current_period_start" in (subscriptionData || {})
                    );
                    console.log(
                        "subscriptionData.current_period_start type:",
                        typeof subscriptionData?.current_period_start
                    );
                    console.log(
                        "subscriptionData.current_period_start value:",
                        subscriptionData?.current_period_start
                    );

                    // Try accessing directly from the payload (maybe it's not nested under data?)
                    console.log("Direct payload check:", {
                        payloadType: typeof payload,
                        payloadKeys: payload ? Object.keys(payload as any) : [],
                    });

                    // Debug: Log raw payload values - try both direct access and via data
                    const rawValues = {
                        viaData: {
                            current_period_start:
                                subscriptionData?.current_period_start,
                            current_period_end:
                                subscriptionData?.current_period_end,
                            trial_start: subscriptionData?.trial_start,
                            trial_end: subscriptionData?.trial_end,
                            recurring_interval:
                                subscriptionData?.recurring_interval,
                            recurring_interval_count:
                                subscriptionData?.recurring_interval_count,
                            amount: subscriptionData?.amount,
                        },
                        directPayload:
                            (payload as any)?.current_period_start ||
                            "not found",
                    };
                    console.log("Raw webhook payload values:", rawValues);

                    // Use the subscriptionData variable we already extracted
                    const updateData = {
                        plan: plan as "free" | "basic" | "plus" | "pro",
                        subscriptionPeriodStart: toDateStringOrNull(
                            subscriptionData?.current_period_start
                        ),
                        subscriptionPeriodEnd: toDateStringOrNull(
                            subscriptionData?.current_period_end
                        ),
                        subscriptionCost: subscriptionData?.amount ?? null,
                        recurringInterval: normalizeRecurringInterval(
                            subscriptionData?.recurring_interval
                        ),
                        recurringIntervalCount:
                            subscriptionData?.recurring_interval_count ?? null,
                        trialPeriodStart: toDateStringOrNull(
                            subscriptionData?.trial_start
                        ),
                        trialPeriodEnd: toDateStringOrNull(
                            subscriptionData?.trial_end
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
