/** @format */
// server_actions/updateUserAvatar.ts
"use server";

import { uploadImage } from "@/lib/storage";
import dbServer from "@/server/db-server";

export type UpdateAvatarFromUrlParams = {
    token: string;
    imageUrl: string;
    fileName?: string;
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

async function removeExistingAvatars(scopedDb: any, uid: string) {
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
    const deleteOps = linkedFiles.map((f) => scopedDb.tx.files[f.id].delete());

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
 * Update avatar from remote URL.
 * Requires that a userProfiles row already exists for the user; this
 * action will NOT create one.
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

    // Ensure profile exists — do not create it here.
    {
        const q = await scopedDb.query({
            userProfiles: { $: { where: { id: uid }, limit: 1 } },
        });
        const existing =
            Array.isArray(q.userProfiles) && q.userProfiles.length > 0;
        if (!existing) {
            return { success: false, error: "User profile not found" };
        }
    }

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
            deletedFileIds: [],
        };
    } catch (err) {
        console.error("updateUserAvatarFromUrl error:", err);
        return { success: false, error: "Failed to upload/link avatar" };
    }
}

/**
 * Update avatar from FormData upload.
 * Requires that a userProfiles row already exists for the user; this
 * action will NOT create one.
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

    // Ensure profile exists — do not create it here.
    try {
        const q = await scopedDb.query({
            userProfiles: { $: { where: { id: uid }, limit: 1 } },
        });
        const existing =
            Array.isArray(q.userProfiles) && q.userProfiles.length > 0;
        if (!existing) {
            return { success: false, error: "User profile not found" };
        }
    } catch (err) {
        return { success: false, error: "Failed to verify profile existence" };
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
    } catch (err) {
        console.error("updateUserAvatarFromForm error:", err);
        return { success: false, error: "Failed to upload/link avatar" };
    }
}
