/** @format */
// server_actions/createUserProfileIfMissing.ts
"use server";

import dbServer from "@/server/db-server";

type Params = {
    token: string;
    name?: string | null;
    imageUrl?: string | null;
    fileName?: string | null;
    contentTypeHint?: string | null;
};

type Result =
    | { created: true; uploadedFileId?: string; txId?: string; reason?: string }
    | { created: false; reason?: string };

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/avif",
]);

function slugify(name: string) {
    return name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9.\-_]/g, "")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "");
}

/**
 * Upload a Blob/File/Buffer using the admin SDK (dbServer.storage.uploadFile).
 * Returns the uploaded file id.
 */
async function uploadImageAdmin(
    file: File | Blob | Buffer,
    path?: string,
    opts?: { contentType?: string; contentDisposition?: string; name?: string }
): Promise<string> {
    // Determine a safe name:
    const fileName =
        // If it's a File, use its name; otherwise fall back to opts.name or path or timestamp
        (typeof File !== "undefined" && file instanceof File && file.name) ||
        opts?.name ||
        (typeof path === "string"
            ? path.split("/").pop() || `${Date.now()}`
            : `${Date.now()}`);

    const safeName = fileName.replace(/\s+/g, "-");
    const filePath = path ?? safeName;

    const contentType =
        opts?.contentType ??
        // if it's a File use its type, otherwise fallback to provided or octet-stream
        (typeof File !== "undefined" && file instanceof File
            ? file.type
            : undefined) ??
        "application/octet-stream";

    const uploadOpts = {
        contentType,
        contentDisposition: opts?.contentDisposition ?? "attachment",
    };

    // Convert Blob/File to Buffer for server-side upload (Node-friendly)
    let payload: Buffer | File | Blob = file as any;
    try {
        if (typeof (file as any)?.arrayBuffer === "function") {
            const ab = await (file as any).arrayBuffer();
            payload = Buffer.from(ab);
        } else if (Buffer.isBuffer(file)) {
            payload = file as Buffer;
        }
    } catch (err) {
        // fallback: pass original (some runtimes accept Blob/File directly)
        payload = file as any;
    }

    try {
        const res: any = await dbServer.storage.uploadFile(
            filePath,
            payload as any,
            uploadOpts
        );
        const id: string | null = res?.data?.id ?? null;
        if (!id) throw new Error("upload did not return file id");
        return id;
    } catch (err) {
        console.error("uploadImageAdmin error:", err);
        throw err;
    }
}

/**
 * Creates a userProfiles row only if one does not already exist.
 * Runs queries/transactions with the admin SDK (dbServer).
 * Verifies the provided refresh token but does NOT scope the DB to user.
 */
export async function createUserProfileIfMissing(
    params: Params
): Promise<Result> {
    const { token, name, imageUrl, fileName, contentTypeHint } = params;

    if (!token || typeof token !== "string") {
        throw new Error("Unauthorized: missing token");
    }

    // Verify the refresh token (admin API) to confirm the user identity.
    const user = await dbServer.auth.verifyToken(token);
    if (!user?.id) {
        throw new Error("Unauthorized: invalid token");
    }
    const uid = user.id as string;

    // 1) Check for existing profile (admin query)
    try {
        const q = await dbServer.query({
            userProfiles: { $: { where: { id: uid }, limit: 1 } },
        });
        const existing =
            Array.isArray(q.userProfiles) && q.userProfiles.length > 0
                ? q.userProfiles[0]
                : undefined;
        if (existing) {
            return { created: false, reason: "profile_exists" };
        }
    } catch (err) {
        throw new Error("Failed to check existing profile: " + String(err));
    }

    // 2) Create the profile row (admin transact)
    let createTxId: string | undefined;
    try {
        const res = await dbServer.transact([
            dbServer.tx.userProfiles[uid]
                .create({
                    joined: new Date(),
                    premium: false,
                    plan: "free",
                    ...(name ? { name } : {}),
                })
                .link({ $user: uid }),
        ]);
        createTxId = (res as any)["tx-id"];
    } catch (err: any) {
        const msg = String(err?.message ?? err);
        // Race: created by someone else in between
        if (msg.includes("Creating entities that exist")) {
            return { created: false, reason: "profile_exists_race" };
        }
        throw new Error("Failed to create profile: " + msg);
    }

    // If no image supplied, we're done.
    if (!imageUrl) {
        return { created: true, txId: createTxId };
    }

    // 3) Fetch, validate, upload, and link image (admin)
    try {
        const parsed = new URL(imageUrl);
        if (!["http:", "https:"].includes(parsed.protocol)) {
            return { created: true, reason: "unsupported_image_protocol" };
        }

        const resp = await fetch(parsed.toString(), { cache: "no-store" });
        if (!resp.ok) {
            return {
                created: true,
                reason: `image_fetch_failed_${resp.status}`,
            };
        }

        const ct =
            (contentTypeHint || resp.headers.get("content-type") || "").split(
                ";"
            )[0] || "";

        if (ct && ALLOWED_TYPES.size && !ALLOWED_TYPES.has(ct)) {
            return { created: true, reason: "unsupported_content_type" };
        }

        const ab = await resp.arrayBuffer();
        if (ab.byteLength > MAX_IMAGE_BYTES) {
            return { created: true, reason: "image_too_large" };
        }

        const blob = new Blob([ab], { type: ct || "image/jpeg" });
        const baseName =
            fileName ||
            (parsed.pathname
                ? parsed.pathname.split("/").pop() || "avatar"
                : "avatar");
        const safe = slugify(baseName);
        const ext = (ct && ct.split("/")[1]) || "jpg";
        const path = `avatars/${uid}-avatar-${Date.now()}-${safe}.${ext}`;

        const uploadedFileId = await uploadImageAdmin(blob, path, {
            contentType: ct || undefined,
            name: baseName,
        });

        // Link uploaded file to the created profile (admin transact)
        try {
            await dbServer.transact([
                dbServer.tx.userProfiles[uid]
                    .update({})
                    .link({ $files: uploadedFileId }),
            ]);
        } catch (err) {
            // Linking failed — profile still created; return partial success
            return { created: true, uploadedFileId, txId: createTxId };
        }

        return { created: true, uploadedFileId, txId: createTxId };
    } catch (err) {
        // Image fetch/upload failed — profile was created, so return success.
        return { created: true, txId: createTxId };
    }
}
