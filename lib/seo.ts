/** @format */

import type { Metadata } from "next";

function ensureAbsoluteUrl(input?: string | null): string {
    const raw = (input || "").trim();
    if (!raw) return "http://localhost:3000";
    // If it already parses as a URL with protocol, return as-is
    try {
        // eslint-disable-next-line no-new
        new URL(raw);
        return raw;
    } catch {}
    // If missing protocol, prepend https://
    const candidate = `https://${raw.replace(/^\/+/, "")}`;
    try {
        // eslint-disable-next-line no-new
        new URL(candidate);
        return candidate;
    } catch {
        return "http://localhost:3000";
    }
}

const siteUrl = ensureAbsoluteUrl(process.env.NEXT_PUBLIC_SITE_URL);
const isProd =
    /^https?:\/\//.test(siteUrl) && !/localhost|127\.0\.0\.1/.test(siteUrl);

export const seoDefaults = {
    siteName: process.env.NEXT_PUBLIC_SITE_NAME || "",
    locale: "en_US",
    description: process.env.NEXT_PUBLIC_SITE_DESCRIPTION || "",
};

export function buildBaseMetadata(): Metadata {
    return {
        metadataBase: new URL(siteUrl),
        title: {
            default: seoDefaults.siteName,
            template: "%s | " + seoDefaults.siteName,
        },
        description: seoDefaults.description,
        icons: {
            icon: [
                { url: "/favicon.ico", rel: "icon" },
                {
                    url: "/favicon-16x16.png",
                    sizes: "16x16",
                    type: "image/png",
                },
                {
                    url: "/favicon-32x32.png",
                    sizes: "32x32",
                    type: "image/png",
                },
            ],
            apple: "/apple-touch-icon.png",
            other: [{ rel: "mask-icon", url: "/safari-pinned-tab.svg" }],
        },
        manifest: "/site.webmanifest",
    };
}

export function sectionTitleTemplate(sectionLabel: string): Metadata["title"] {
    // Do NOT include siteName here; the root layout template appends it.
    return {
        default: sectionLabel,
        template: `%s | ${sectionLabel}`,
    };
}

export function robotsForPath(pathname: string): Metadata["robots"] {
    const nonIndexPatterns = [
        /^\/app\//,
        /^\/api\//,
        /^\/account(\/|$)/,
        /^\/login(\/|$)/,
        /^\/dashboard(\/|$)/,
    ];
    const noindex = !isProd || nonIndexPatterns.some((re) => re.test(pathname));
    return {
        index: !noindex,
        follow: !noindex,
    };
}

export function canonicalFor(pathname: string): string {
    const base = siteUrl.replace(/\/$/, "");
    if (pathname === "/") return `${base}/`;
    return `${base}${pathname}`;
}

/** @format */

const siteName = "Vizier's Vault";
