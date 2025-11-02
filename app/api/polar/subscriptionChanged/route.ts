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
        const plan = subscriptionPayload.data.product?.name?.split(" -")[0] as
            | "free"
            | "basic"
            | "plus"
            | "pro";
        const user = await dbServer.auth.getUser({
            email: subscriptionPayload.data.customer?.email,
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
                    // Access the data directly - the webhook wrapper converts snake_case to camelCase
                    // Use 'as any' to access camelCase properties since types define snake_case
                    const subscriptionData = subscriptionPayload.data as any;

                    // Use camelCase property names (webhook wrapper transforms snake_case to camelCase)
                    const updateData = {
                        plan: plan as "free" | "basic" | "plus" | "pro",
                        subscriptionPeriodStart: toDateStringOrNull(
                            subscriptionData?.currentPeriodStart
                        ),
                        subscriptionPeriodEnd: toDateStringOrNull(
                            subscriptionData?.currentPeriodEnd
                        ),
                        subscriptionCost: subscriptionData?.amount ?? null,
                        recurringInterval: normalizeRecurringInterval(
                            subscriptionData?.recurringInterval
                        ),
                        recurringIntervalCount:
                            subscriptionData?.recurringIntervalCount ?? null,
                        trialPeriodStart: toDateStringOrNull(
                            subscriptionData?.trialStart
                        ),
                        trialPeriodEnd: toDateStringOrNull(
                            subscriptionData?.trialEnd
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
