/** @format */

"use client";

/**
 * Image helper: detect SVG, optionally convert raster images
 * to webp and build an upload candidate.
 */

export interface UploadCandidate {
    blobOrFile: Blob | File;
    type: string;
    name: string;
}

export const isSvgFile = (file: File) =>
    file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg");

/**
 * Try converting a raster File to WebP via canvas.
 * Returns a Blob or null on failure.
 */
export async function convertRasterToWebp(
    file: File,
    quality = 0.92
): Promise<Blob | null> {
    if (isSvgFile(file)) return null;

    try {
        // createImageBitmap handles orientation and is faster than new Image()
        const bitmap = await createImageBitmap(file);
        const canvas = document.createElement("canvas");
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;
        ctx.drawImage(bitmap, 0, 0);
        return await new Promise<Blob | null>((resolve) => {
            canvas.toBlob((b) => resolve(b), "image/webp", quality);
        });
    } catch {
        return null;
    }
}

/**
 * Produce a candidate (File or Blob + metadata) to upload.
 * If conversion to webp yields a smaller blob, use it and
 * add a .webp filename. Otherwise keep the original File.
 */
export async function makeUploadCandidate(
    file: File,
    threshold = 200 * 1024
): Promise<UploadCandidate> {
    const isSvg = isSvgFile(file);
    let candidateBlob: Blob | File = file;
    let candidateType = file.type;
    let candidateName = file.name.replace(/\s+/g, "-");

    if (!isSvg && file.size > threshold) {
        const converted = await convertRasterToWebp(file);
        if (converted && converted.size < file.size) {
            const base = file.name.replace(/\.[^/.]+$/, "");
            const webpName = `${base}.webp`.replace(/\s+/g, "-");
            candidateBlob = new File([converted], webpName, {
                type: "image/webp",
            });
            candidateType = "image/webp";
            candidateName = webpName;
        }
    }

    return {
        blobOrFile: candidateBlob,
        type: candidateType,
        name: candidateName,
    };
}
