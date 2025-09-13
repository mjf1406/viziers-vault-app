/** @format */

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    const body = await req.json().catch(() => ({} as any));
    const userId = typeof body?.userId === "string" ? body.userId.trim() : "";
    const plan = typeof body?.plan === "string" ? body.plan.trim() : "";

    if (!userId || !plan) {
        return NextResponse.json(
            { ok: false, error: "Missing userId or plan" },
            { status: 400 }
        );
    }

    const res = NextResponse.json({ ok: true });
    // Short-lived cookies; middleware only needs a hint
    const maxAge = 60 * 60 * 24 * 7; // 7 days
    res.cookies.set("vv_uid", userId, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge,
    });
    res.cookies.set("vv_plan", plan, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge,
    });
    return res;
}
