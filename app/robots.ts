/** @format */

import type { MetadataRoute } from "next";

function ensureAbsoluteUrl(input?: string | null): string {
    const raw = (input || "").trim();
    if (!raw) return "http://localhost:3000";
    try {
        new URL(raw);
        return raw;
    } catch {}
    const candidate = `https://${raw.replace(/^\/+/, "")}`;
    try {
        new URL(candidate);
        return candidate;
    } catch {
        return "http://localhost:3000";
    }
}

export default function robots(): MetadataRoute.Robots {
    const base = ensureAbsoluteUrl(process.env.NEXT_PUBLIC_SITE_URL);
    const isProd =
        /^https?:\/\//.test(base) && !/localhost|127\.0\.0\.1/.test(base);

    const disallow = ["/app/", "/api/", "/account", "/login", "/dashboard"];

    return {
        rules: [
            {
                userAgent: "*",
                allow: isProd ? "/" : [],
                disallow: isProd ? disallow : ["/"],
            },
        ],
        sitemap: `${base}/sitemap.xml`,
    };
}
