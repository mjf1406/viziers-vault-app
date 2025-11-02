/** @format */

// api/polar/checkout/route.ts
import { Checkout } from "@polar-sh/nextjs";

export const GET = Checkout({
    accessToken: process.env.SANDBOX_POLAR_ACCESS_TOKEN,
    successUrl: process.env.POLAR_SUCCESS_URL,
    returnUrl: "https://www.viziersvault.com/app/account", // An optional URL which renders a back-button in the Checkout
    server: "sandbox", // Use sandbox if you're testing Polar - omit the parameter or pass 'production' otherwise
    // theme: "dark", // Enforces the theme - System-preferred theme will be set if left omitted
});
