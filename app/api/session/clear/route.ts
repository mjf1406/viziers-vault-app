/** @format */

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    const origin = (req.headers.get("origin") || "").toLowerCase();
    const referer = (req.headers.get("referer") || "").toLowerCase();
    const allowedOrigins = new Set([
        "http://localhost:3000",
        "https://viziersvault.com",
    ]);
    const originOk = [...allowedOrigins].some(
        (o) => origin === o || referer.startsWith(o)
    );
    if (!originOk) {
        return NextResponse.json(
            { ok: false, error: "Forbidden" },
            { status: 403 }
        );
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set("vv_uid", "", { httpOnly: true, path: "/", maxAge: 0 });
    res.cookies.set("vv_plan", "", { httpOnly: true, path: "/", maxAge: 0 });
    res.cookies.set("vv_hint", "", { httpOnly: true, path: "/", maxAge: 0 });
    return res;
}
