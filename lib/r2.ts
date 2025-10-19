/** @format */

import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const r2Client = new S3Client({
    region: process.env.R2_REGION!,
    endpoint: process.env.R2_ENDPOINT!,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: true,
});

export async function getR2ObjectText(key: string): Promise<string> {
    const bucket = process.env.R2_BUCKET!;
    const res = await r2Client.send(
        new GetObjectCommand({ Bucket: bucket, Key: key })
    );
    // @ts-expect-error - aws sdk types allow Body to be a stream with transformToString at runtime
    const bodyText: string = await res.Body?.transformToString("utf-8");
    if (typeof bodyText !== "string") {
        throw new Error("Failed to read R2 object body as text");
    }
    return bodyText;
}
