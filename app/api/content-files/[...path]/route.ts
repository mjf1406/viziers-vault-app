/** @format */

import { NextResponse, NextRequest } from "next/server";
import path from "path";
import fs from "fs";

export async function GET(
    _req: NextRequest,
    context: { params: Promise<{ path: string[] }> }
) {
    const { path: pathSegments } = await context.params;
    const rel = pathSegments.join("/");
    const baseDir = path.join(process.cwd(), "content");
    const abs = path.join(baseDir, rel);

    if (!abs.startsWith(baseDir)) {
        return new NextResponse("Not Found", { status: 404 });
    }
    if (!fs.existsSync(abs)) {
        return new NextResponse("Not Found", { status: 404 });
    }

    const stat = fs.statSync(abs);
    if (!stat.isFile()) {
        return new NextResponse("Not Found", { status: 404 });
    }

    const file = fs.readFileSync(abs);
    const ext = path.extname(abs).toLowerCase();
    const type =
        ext === ".svg"
            ? "image/svg+xml"
            : ext === ".png"
            ? "image/png"
            : ext === ".jpg" || ext === ".jpeg"
            ? "image/jpeg"
            : "application/octet-stream";

    return new NextResponse(file, {
        status: 200,
        headers: {
            "content-type": type,
            "cache-control": "public, max-age=3600",
        },
    });
}
