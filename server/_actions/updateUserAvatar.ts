/** @format */
// server_actions/updateUserAvatar.ts
"use server";

// If your storage uploader is available on the server, import it here.
// It should accept a Blob|File, a storage path, and optional metadata, and
// return a file entity id that can be linked via $files.
import { uploadImage } from "@/lib/storage";
import dbServer from "../db-server";

export type UpdateAvatarFromUrlParams = {
    // user.refresh_token from the client
    token: string;
    imageUrl: string;
    // Optional filename hint for storage path
    fileName?: string;
    // Optional content type override; else inferred from fetch headers
    contentTypeHint?: string;
};

export type UpdateAvatarFromFormResult =
    | {
          success: true;
          uploadedFileId: string;
          txId?: string;
          deletedFileIds: string[];
      }
    | {
          success: false;
          error: string;
      };

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/avif",
]);

function slugify(name: string): string {
    return name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9.\-_]/g, "");
}

async function ensureProfileExists(scopedDb: any, uid: string) {
    try {
        await scopedDb.transact([
            scopedDb.tx.userProfiles[uid]
                .create({
                    joined: new Date(),
                    premium: false,
                    plan: "free",
                })
                .link({ $user: uid }),
        ]);
    } catch (err: any) {
        const msg = String(err?.message ?? "");
        if (!msg.includes("Creating entities that exist")) {
            throw err;
        }
    }
}

async function removeExistingAvatars(scopedDb: any, uid: string) {
    // Assumes the relation key is $files and the file table is files.
    const data = await scopedDb.query({
        userProfiles: {
            $: { where: { id: uid }, limit: 1 },
            $files: {},
        },
    });

    const profile = Array.isArray(data.userProfiles)
        ? data.userProfiles[0]
        : undefined;

    const linkedFiles: Array<{ id: string }> =
        (profile?.$files as Array<{ id: string }>) ?? [];

    if (!linkedFiles.length) return { deleted: [], txId: undefined as any };

    const unlinkOps = linkedFiles.map((f) =>
        scopedDb.tx.userProfiles[uid].unlink({ $files: f.id })
    );
    const deleteOps = linkedFiles.map((f) =>
        // If your schema uses a different table name, change "files" below.
        scopedDb.tx.files[f.id].delete()
    );

    const res = await scopedDb.transact([...unlinkOps, ...deleteOps]);

    return {
        deleted: linkedFiles.map((f) => f.id),
        txId: (res as any)["tx-id"],
    };
}

async function uploadAndLinkAvatar(
    scopedDb: any,
    uid: string,
    blobOrFile: Blob,
    fileNameBase: string,
    contentType?: string
) {
    const safeBase = slugify(fileNameBase || "avatar");
    const extFromType =
        contentType?.split("/")[1] ??
        (safeBase.includes(".") ? safeBase.split(".").pop() ?? "jpg" : "jpg");

    const path = `avatars/${uid}-avatar-${Date.now()}-${safeBase.replace(
        /\.+$/,
        ""
    )}.${extFromType}`;

    const uploadedFileId = await uploadImage(blobOrFile as any, path, {
        contentType,
    });

    // Link new avatar
    const res = await scopedDb.transact([
        scopedDb.tx.userProfiles[uid]
            .update({})
            .link({ $files: uploadedFileId }),
    ]);

    return {
        uploadedFileId,
        txId: (res as any)["tx-id"],
    };
}

/**
 * Server action: update avatar from a remote URL (e.g., Google profile photo).
 * Also deletes all previously linked avatar files and links.
 */
export async function updateUserAvatarFromUrl(
    params: UpdateAvatarFromUrlParams
): Promise<UpdateAvatarFromFormResult> {
    const { token, imageUrl, fileName, contentTypeHint } = params;

    if (!token || typeof token !== "string") {
        throw new Error("Unauthorized: missing token");
    }
    const user = await dbServer.auth.verifyToken(token);
    if (!user?.id) {
        throw new Error("Unauthorized: invalid token");
    }

    let url: URL;
    try {
        url = new URL(imageUrl);
    } catch {
        return { success: false, error: "Invalid imageUrl" };
    }
    if (!["http:", "https:"].includes(url.protocol)) {
        return { success: false, error: "Unsupported URL protocol" };
    }

    const scopedDb = dbServer.asUser({ token });
    const uid = user.id as string;

    await ensureProfileExists(scopedDb, uid);

    // Fetch the image
    let resp: Response;
    try {
        resp = await fetch(url.toString(), { cache: "no-store" });
    } catch {
        return { success: false, error: "Failed to fetch remote image" };
    }
    if (!resp.ok) {
        return {
            success: false,
            error: `Remote image fetch failed: ${resp.status}`,
        };
    }

    const ct =
        contentTypeHint ||
        resp.headers.get("content-type") ||
        "application/octet-stream";

    if (ct && ALLOWED_TYPES.size && !ALLOWED_TYPES.has(ct)) {
        return { success: false, error: `Unsupported content-type: ${ct}` };
    }

    const lenHeader = resp.headers.get("content-length");
    if (lenHeader && Number(lenHeader) > MAX_IMAGE_BYTES) {
        return { success: false, error: "Image exceeds max size" };
    }

    const ab = await resp.arrayBuffer();
    if (ab.byteLength > MAX_IMAGE_BYTES) {
        return { success: false, error: "Image exceeds max size" };
    }

    const blob = new Blob([ab], { type: ct });

    // Remove old avatars first
    try {
        await removeExistingAvatars(scopedDb, uid);
    } catch {
        return { success: false, error: "Failed to remove previous avatars" };
    }

    // Upload and link
    try {
        const baseName =
            fileName ||
            (url.pathname
                ? url.pathname.split("/").pop() || "avatar"
                : "avatar");
        const { uploadedFileId } = await uploadAndLinkAvatar(
            scopedDb,
            uid,
            blob,
            baseName,
            ct
        );

        return {
            success: true,
            uploadedFileId,
            txId: undefined,
            deletedFileIds: [], // not strictly needed; previous step already removed
        };
    } catch {
        return { success: false, error: "Failed to upload/link avatar" };
    }
}

/**
 * Server action: update avatar from a FormData upload.
 * Accepts fields:
 *  - token: string (user.refresh_token)
 *  - avatar: File
 *  - fileName?: string (optional override)
 */
export async function updateUserAvatarFromForm(
    formData: FormData
): Promise<UpdateAvatarFromFormResult> {
    const token = String(formData.get("token") || "");
    if (!token) {
        throw new Error("Unauthorized: missing token");
    }
    const user = await dbServer.auth.verifyToken(token);
    if (!user?.id) {
        throw new Error("Unauthorized: invalid token");
    }

    const file = formData.get("avatar");
    if (!(file instanceof File)) {
        return { success: false, error: "Missing avatar file" };
    }
    const overrideName = formData.get("fileName");
    const fileName =
        typeof overrideName === "string" && overrideName.trim()
            ? overrideName.trim()
            : file.name || "avatar";

    if (file.size > MAX_IMAGE_BYTES) {
        return { success: false, error: "Image exceeds max size" };
    }

    const ct = file.type || "application/octet-stream";
    if (ct && ALLOWED_TYPES.size && !ALLOWED_TYPES.has(ct)) {
        return { success: false, error: `Unsupported content-type: ${ct}` };
    }

    const scopedDb = dbServer.asUser({ token });
    const uid = user.id as string;

    try {
        await ensureProfileExists(scopedDb, uid);
    } catch {
        return { success: false, error: "Failed to ensure profile exists" };
    }

    // Remove old avatars first
    let deletedFileIds: string[] = [];
    try {
        const removed = await removeExistingAvatars(scopedDb, uid);
        deletedFileIds = removed.deleted;
    } catch {
        return { success: false, error: "Failed to remove previous avatars" };
    }

    // Upload and link
    try {
        const { uploadedFileId, txId } = await uploadAndLinkAvatar(
            scopedDb,
            uid,
            file,
            fileName,
            ct
        );
        return { success: true, uploadedFileId, txId, deletedFileIds };
    } catch {
        return { success: false, error: "Failed to upload/link avatar" };
    }
}
