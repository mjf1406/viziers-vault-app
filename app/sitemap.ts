/** @format */

import type { MetadataRoute } from "next";
import { listSectionSlugs } from "@/lib/markdown";

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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const base = ensureAbsoluteUrl(process.env.NEXT_PUBLIC_SITE_URL);
    const now = new Date().toISOString();

    const staticRoutes = [
        "/",
        "/web/about",
        "/web/pricing",
        "/web/faq",
        "/web/contact",
        "/web/terms-of-service",
        "/web/privacy-policy",
        "/web/cookie-policy",
        "/web/roadmap",
        "/web/team",
        "/app/dashboard",
        "/blog",
        "/docs",
    ];

    const blog = listSectionSlugs("blog").map((slug) => ({
        url: `${base}/blog/${slug.join("/")}`,
        lastModified: now,
    }));
    const docs = listSectionSlugs("docs").map((slug) => ({
        url: `${base}/docs/${slug.join("/")}`,
        lastModified: now,
    }));

    return [
        ...staticRoutes.map((p) => ({ url: `${base}${p}`, lastModified: now })),
        ...blog,
        ...docs,
    ];
}
