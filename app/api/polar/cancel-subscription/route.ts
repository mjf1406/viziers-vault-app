/** @format */

import { NextRequest, NextResponse } from "next/server";
import dbServer from "@/server/db-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json(
                { error: "Email is required" },
                { status: 400 }
            );
        }

        // Verify the user exists
        const user = await dbServer.auth.getUser({ email });
        if (!user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Get the user's profile to check their plan
        const profileQuery = await dbServer.query({
            profiles: {
                $: {
                    where: { user: user.id },
                },
            },
        });

        const profile = profileQuery.profiles?.[0];
        if (!profile) {
            return NextResponse.json(
                { error: "Profile not found" },
                { status: 404 }
            );
        }

        const plan = profile.plan;
        if (plan === "free") {
            return NextResponse.json(
                { error: "No active subscription to cancel" },
                { status: 400 }
            );
        }

        // Get Polar access token (use sandbox for testing, production for live)
        const accessToken =
            process.env.SANDBOX_POLAR_ACCESS_TOKEN ||
            process.env.POLAR_ACCESS_TOKEN;

        if (!accessToken) {
            return NextResponse.json(
                { error: "Polar access token not configured" },
                { status: 500 }
            );
        }

        // Determine Polar API base URL (sandbox vs production)
        const isSandbox = !!process.env.SANDBOX_POLAR_ACCESS_TOKEN;
        const apiBaseUrl = isSandbox
            ? "https://sandbox-api.polar.sh/v1"
            : "https://api.polar.sh/v1";

        // First, find the customer by email
        const customersResponse = await fetch(
            `${apiBaseUrl}/customers?email=${encodeURIComponent(email)}`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            }
        );

        if (!customersResponse.ok) {
            const errorText = await customersResponse.text();
            console.error("Failed to fetch customers:", errorText);
            let errorMessage = "Failed to fetch customer from Polar";
            try {
                const errorJson = JSON.parse(errorText);
                errorMessage =
                    errorJson.detail || errorJson.message || errorMessage;
            } catch {
                errorMessage = errorText || errorMessage;
            }
            return NextResponse.json(
                { error: errorMessage },
                { status: customersResponse.status }
            );
        }

        const customersData = await customersResponse.json();
        const customers = customersData.items || customersData.results || [];

        if (customers.length === 0) {
            return NextResponse.json(
                { error: "Customer not found in Polar" },
                { status: 404 }
            );
        }

        const customer = customers[0];

        // Get active subscriptions for this customer
        const subscriptionsResponse = await fetch(
            `${apiBaseUrl}/subscriptions?customer_id=${customer.id}`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            }
        );

        if (!subscriptionsResponse.ok) {
            const errorText = await subscriptionsResponse.text();
            console.error("Failed to fetch subscriptions:", errorText);
            let errorMessage = "Failed to fetch subscriptions from Polar";
            try {
                const errorJson = JSON.parse(errorText);
                errorMessage =
                    errorJson.detail || errorJson.message || errorMessage;
            } catch {
                errorMessage = errorText || errorMessage;
            }
            return NextResponse.json(
                { error: errorMessage },
                { status: subscriptionsResponse.status }
            );
        }

        const subscriptionsData = await subscriptionsResponse.json();
        console.log(
            "Subscriptions response:",
            JSON.stringify(subscriptionsData, null, 2)
        );

        const subscriptions =
            subscriptionsData.items ||
            subscriptionsData.results ||
            subscriptionsData ||
            [];

        console.log(
            `Found ${subscriptions.length} subscription(s) for customer ${customer.id}`
        );

        // Find active subscription (not canceled, not ended)
        const activeSubscription = subscriptions.find(
            (sub: any) =>
                sub.status !== "canceled" &&
                sub.status !== "ended" &&
                !sub.ended_at
        );

        if (!activeSubscription) {
            console.log(
                "Available subscriptions:",
                subscriptions.map((s: any) => ({
                    id: s.id,
                    status: s.status,
                    ended_at: s.ended_at,
                }))
            );
            return NextResponse.json(
                {
                    error: "No active subscription found",
                    availableSubscriptions: subscriptions.map((s: any) => ({
                        id: s.id,
                        status: s.status,
                    })),
                },
                { status: 404 }
            );
        }

        console.log(
            `Canceling subscription ${activeSubscription.id} with status ${activeSubscription.status}`
        );

        // Cancel subscription at period end (don't revoke immediately)
        // This allows users to keep access until the end of their billing period
        // Works for both trialing and active subscriptions
        console.log(
            `Setting subscription to cancel at period end (status: ${activeSubscription.status})`
        );

        const cancelResponse = await fetch(
            `${apiBaseUrl}/subscriptions/${activeSubscription.id}`,
            {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    cancel_at_period_end: true,
                }),
            }
        );

        // Read response once
        const responseText = await cancelResponse.text();

        if (!cancelResponse.ok) {
            console.error("Failed to cancel subscription:", {
                status: cancelResponse.status,
                statusText: cancelResponse.statusText,
                error: responseText,
                subscriptionId: activeSubscription.id,
                url: `${apiBaseUrl}/subscriptions/${activeSubscription.id}/cancel`,
            });
            let errorMessage = "Failed to cancel subscription";
            try {
                const errorJson = JSON.parse(responseText);
                errorMessage =
                    errorJson.detail || errorJson.message || errorMessage;
            } catch {
                if (responseText) {
                    errorMessage = responseText;
                }
            }
            return NextResponse.json(
                {
                    error: errorMessage,
                    details: responseText,
                    status: cancelResponse.status,
                },
                { status: cancelResponse.status }
            );
        }

        // Handle empty response (204 No Content) or JSON response
        let canceledSubscription = null;
        if (responseText) {
            try {
                canceledSubscription = JSON.parse(responseText);
            } catch (e) {
                // If not JSON, that's okay - might be empty response
                console.log(
                    "Cancel response was not JSON (likely empty):",
                    responseText.substring(0, 100)
                );
            }
        }

        return NextResponse.json({
            success: true,
            message:
                "Subscription will be canceled at the end of the billing period. You'll continue to have access until then.",
            subscription: canceledSubscription,
        });
    } catch (error: any) {
        console.error("Error canceling subscription:", error);
        return NextResponse.json(
            { error: "Internal server error", details: error.message },
            { status: 500 }
        );
    }
}
