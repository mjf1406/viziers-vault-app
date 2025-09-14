/** @format */

// Edge-compatible HMAC-SHA256 signing/verification for the vv_hint cookie.
// Cookie format: base64url(JSON(payload)).base64url(HMAC_SHA256(payload))

export type HintPayload = {
    uid: string;
    tier: string;
    iat: number; // ms epoch
    exp: number; // ms epoch
};

function getCrypto(): Crypto {
    if (typeof globalThis !== "undefined" && (globalThis as any).crypto) {
        return (globalThis as any).crypto as Crypto;
    }
    throw new Error("Web Crypto API is not available in this runtime");
}

function textEncoder(): TextEncoder {
    return new TextEncoder();
}

function base64UrlEncode(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++)
        binary += String.fromCharCode(bytes[i]);
    const b64 =
        typeof btoa === "function"
            ? btoa(binary)
            : Buffer.from(binary, "binary").toString("base64");
    return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(input: string): Uint8Array {
    const b64 =
        input.replace(/-/g, "+").replace(/_/g, "/") +
        "==".slice(0, (4 - (input.length % 4)) % 4);
    const binary =
        typeof atob === "function"
            ? atob(b64)
            : Buffer.from(b64, "base64").toString("binary");
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
    return out;
}

async function importKey(secret: string): Promise<CryptoKey> {
    const keyBytes = textEncoder().encode(secret);
    return await getCrypto().subtle.importKey(
        "raw",
        keyBytes,
        { name: "HMAC", hash: { name: "SHA-256" } },
        false,
        ["sign", "verify"]
    );
}

async function hmacSha256(
    key: CryptoKey,
    data: Uint8Array
): Promise<ArrayBuffer> {
    // Create a fresh ArrayBuffer (not SharedArrayBuffer) to satisfy strict BufferSource types
    const exact = new ArrayBuffer(data.byteLength);
    new Uint8Array(exact).set(data);
    return await getCrypto().subtle.sign("HMAC", key, exact);
}

export async function signHint(
    payload: HintPayload,
    secret: string
): Promise<string> {
    const key = await importKey(secret);
    const json = JSON.stringify(payload);
    const data = textEncoder().encode(json);
    const sig = await hmacSha256(key, data);
    const dataBuf = data.buffer.slice(
        data.byteOffset,
        data.byteOffset + data.byteLength
    );
    return `${base64UrlEncode(dataBuf)}.${base64UrlEncode(sig)}`;
}

export type VerifiedHint = HintPayload & { valid: true };

export async function verifyHint(
    value: string,
    secret: string
): Promise<VerifiedHint | null> {
    try {
        const [payloadB64, sigB64] = value.split(".");
        if (!payloadB64 || !sigB64) return null;
        const key = await importKey(secret);
        const payloadBytes = base64UrlDecode(payloadB64);
        const expectedSig = await hmacSha256(key, payloadBytes);
        const actualSig = base64UrlDecode(sigB64);

        // Constant-time-ish compare
        if (expectedSig.byteLength !== actualSig.byteLength) return null;
        const expected = new Uint8Array(expectedSig);
        let mismatch = 0;
        for (let i = 0; i < expected.length; i++)
            mismatch |= expected[i] ^ actualSig[i];
        if (mismatch !== 0) return null;

        const json = new TextDecoder().decode(payloadBytes);
        const parsed = JSON.parse(json) as HintPayload;
        if (typeof parsed.uid !== "string" || typeof parsed.tier !== "string")
            return null;
        if (typeof parsed.iat !== "number" || typeof parsed.exp !== "number")
            return null;
        if (Date.now() > parsed.exp) return null;
        return { ...parsed, valid: true } as VerifiedHint;
    } catch {
        return null;
    }
}
