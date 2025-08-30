/** @format */

"use server";

import dbServer from "@/server/db-server";
import { uploadImage } from "@/lib/storage";

type CreateUserAvatarInput = {
    email: string;
    url: string;
};

function assertEmail(email: string) {
    if (
        typeof email !== "string" ||
        email.length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
        throw new Error("Invalid email");
    }
}

function isAllowedAvatarHost(hostname: string): boolean {
    const h = hostname.toLowerCase();
    return (
        h === "lh3.googleusercontent.com" ||
        h === "lh4.googleusercontent.com" ||
        h === "lh5.googleusercontent.com" ||
        h === "lh6.googleusercontent.com" ||
        h.endsWith(".googleusercontent.com")
    );
}

export async function createUserAvatar({ email, url }: CreateUserAvatarInput) {
    assertEmail(email);

    // Verify the user exists and is logged in (per requirement)
    const user = await dbServer.auth.getUser({ email });
    const userId = (user as any)?.id;
    if (!userId) {
        throw new Error("Unauthorized");
    }

    let parsed: URL;
    try {
        parsed = new URL(url);
    } catch {
        throw new Error("Invalid avatar URL");
    }
    if (parsed.protocol !== "https:") {
        throw new Error("Avatar URL must use HTTPS");
    }
    if (!isAllowedAvatarHost(parsed.hostname)) {
        throw new Error("Avatar host not allowed");
    }

    const resp = await fetch(parsed.toString(), {
        redirect: "follow",
        headers: { Accept: "image/*" },
        cache: "no-store",
    });
    if (!resp.ok) {
        throw new Error(`Failed to fetch avatar (${resp.status})`);
    }

    const contentType = resp.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
        throw new Error("Avatar is not an image");
    }

    const maxBytes = 8 * 1024 * 1024;
    const cl = Number(resp.headers.get("content-length") || 0);
    if (cl && cl > maxBytes) {
        throw new Error("Avatar too large");
    }
    const arrayBuf = await resp.arrayBuffer();
    if (arrayBuf.byteLength > maxBytes) {
        throw new Error("Avatar too large");
    }

    const type = contentType.split(";")[0].toLowerCase();
    const subtype = type.split("/")[1] || "jpeg";
    if (subtype === "svg" || subtype === "svg+xml") {
        throw new Error("SVG avatars are not supported");
    }

    const blob = new Blob([arrayBuf], { type });
    const base = parsed.pathname.split("/").filter(Boolean).pop() || "avatar";
    const safeBase = base.replace(/[^\w.-]+/g, "-").slice(0, 64);
    const filename = `${userId}-avatar-${Date.now()}-${safeBase}`;
    const path = `avatars/${filename}`;

    const fileId = await uploadImage(blob, path, { contentType: type });

    // Link avatar file to the profile (best-effort)
    try {
        await dbServer.transact(
            dbServer.tx.userProfiles[userId].update({}).link({ $files: fileId })
        );
    } catch {
        // non-fatal
    }

    return { ok: true, fileId, path };
}
