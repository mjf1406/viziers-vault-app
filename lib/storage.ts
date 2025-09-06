/** @format */
// lib\storage.ts
import db from "./db";

export type UploadOpts = {
    contentType?: string;
    contentDisposition?: string;
    // optional name to use when uploading a Blob (since Blob doesn't have a .name)
    name?: string;
};

/**
 * Upload an image (File or Blob) and return the storage file id.
 * Throws on failure.
 */
export async function uploadImage(
    file: File | Blob,
    path?: string,
    opts?: UploadOpts
): Promise<string> {
    // Determine a safe name:
    const fileName =
        // If it's a File, use its name; otherwise fall back to opts.name or path or a timestamp name
        (file instanceof File && file.name) ||
        opts?.name ||
        (typeof path === "string"
            ? path.split("/").pop() || `${Date.now()}`
            : `${Date.now()}`);

    const safeName = fileName.replace(/\s+/g, "-");
    const filePath = path ?? safeName;

    const contentType =
        opts?.contentType ??
        // if it's a File use its type, otherwise fallback to provided or octet-stream
        (file instanceof File ? file.type : undefined) ??
        "application/octet-stream";

    const uploadOpts = {
        contentType,
        contentDisposition: opts?.contentDisposition ?? "attachment",
    };

    try {
        // db.storage.uploadFile should accept Blob or File; pass as-is.
        const res: any = await db.storage.uploadFile(
            filePath,
            file,
            uploadOpts
        );
        const id: string | null = res?.data?.id ?? null;
        if (!id) throw new Error("upload did not return file id");
        return id;
    } catch (err) {
        console.error("Error uploading image:", err);
        throw err;
    }
}
