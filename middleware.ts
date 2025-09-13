/** @format */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { enforceRateLimit } from "./lib/ratelimit";

export const config = {
    matcher: [
        // Apply to everything under (app) group paths, which render as /app/*
        "/app/:path*",
        // And to api if present
        "/api/:path*",
    ],
};

export async function middleware(req: NextRequest) {
    const result = await enforceRateLimit(req);
    if (result.ok) {
        const res = NextResponse.next();
        for (const [k, v] of Object.entries(result.headers))
            res.headers.set(k, v);
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
    return res;
}
