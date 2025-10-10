/** @format */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { enforceRateLimit } from "./lib/ratelimit";

export const config = {
    matcher: ["/app/:path*", "/api/:path*"],
};

export async function middleware(req: NextRequest) {
    const result = await enforceRateLimit(req);
    if (result.ok) {
        const res = NextResponse.next();
        for (const [k, v] of Object.entries(result.headers))
            res.headers.set(k, v);
        // Add conservative security headers
        res.headers.set("X-Frame-Options", "DENY");
        res.headers.set("X-Content-Type-Options", "nosniff");
        res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
        res.headers.set(
            "Permissions-Policy",
            "camera=(), microphone=(), geolocation=()"
        );
        return res;
    }

    const res = NextResponse.json(result.body, { status: result.status });
    for (const [k, v] of Object.entries(result.headers)) res.headers.set(k, v);
    // Surface a short-lived cookie so client can read and display a toast
    const msg = result.body?.error || "Rate limit exceeded";
    res.cookies.set("vv_rl_msg", msg, {
        path: "/",
        maxAge: 10,
        sameSite: "lax",
    });
    res.headers.set("X-Frame-Options", "DENY");
    res.headers.set("X-Content-Type-Options", "nosniff");
    res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    res.headers.set(
        "Permissions-Policy",
        "camera=(), microphone=(), geolocation=()"
    );
    return res;
}
