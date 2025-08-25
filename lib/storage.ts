/** @format */

// lib/storage.ts

import db from "./db";
import { InstantFile } from "./types";

export type UploadOpts = {
    contentType?: string;
    contentDisposition?: string;
};

/**
 * Upload an image and return the storage file id.
 * Throws on failure.
 */
export async function uploadImage(
    file: File,
    path?: string,
    opts?: UploadOpts
): Promise<string> {
    const safeName = file.name.replace(/\s+/g, "-");
    const filePath = path ?? safeName;
    const uploadOpts = {
        contentType:
            opts?.contentType ?? file.type ?? "application/octet-stream",
        contentDisposition: opts?.contentDisposition ?? "attachment",
    };

    try {
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

// `delete` is what we use to delete a file from storage
// `$files` will automatically update once the delete is complete
export async function deleteImage(image: InstantFile) {
    await db.storage.delete(image.path);
}
