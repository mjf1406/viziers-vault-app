/** @format */

import { Webhooks } from "@polar-sh/nextjs";

// Ensure this route is dynamic and not statically generated
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const POST = Webhooks({
    webhookSecret: process.env.POLAR_SUBSCRIPTION_CHANGED_SECRET!,
    onPayload: async (payload) => {
        console.log("\n" + "=".repeat(80));
        console.log("🔔 POLAR WEBHOOK: subscriptionChanged");
        console.log("=".repeat(80));
        console.log(`📅 Timestamp: ${new Date().toISOString()}`);
        console.log(`📦 Event Type: ${payload.type}`);
        console.log("\n📋 Payload Details:");
        console.log("-".repeat(80));

        // Log the full payload in a readable format
        console.log(JSON.stringify(payload, null, 2));

        console.log("\n" + "-".repeat(80));
        console.log("✅ Webhook processed successfully");
        console.log("=".repeat(80) + "\n");

        // No need to return an acknowledge response
    },
});
