/** @format */
// server_actions/createUserProfileIfMissing.ts
"use server";

import dbServer from "@/server/db-server";

type Params = {
    token: string;
    name?: string | null;
    imageUrl?: string | null;
};

type Result =
    | { created: true; txId?: string; reason?: string }
    | { created: false; reason?: string };

/**
 * Creates a profiles row only if one does not already exist.
 * Runs queries/transactions with the admin SDK (dbServer).
 * Verifies the provided refresh token but does NOT scope the DB to user.
 */
export async function createUserProfileIfMissing(
    params: Params
): Promise<Result> {
    const { token, name, imageUrl } = params;

    if (!token || typeof token !== "string") {
        throw new Error("Unauthorized: missing token");
    }

    // Verify the refresh token (admin API) to confirm the user identity.
    const user = await dbServer.auth.verifyToken(token);
    if (!user?.id) {
        throw new Error("Unauthorized: invalid token");
    }
    const uid = user.id as string;

    // Parse name into firstName and lastName
    let firstName = "";
    let lastName = "";
    if (name) {
        const nameParts = name.trim().split(/\s+/);
        if (nameParts.length > 0) {
            firstName = nameParts[0];
            if (nameParts.length > 1) {
                lastName = nameParts.slice(1).join(" ");
            }
        }
    }

    // 1) Check for existing profile (admin query)
    try {
        const q = await dbServer.query({
            profiles: { $: { where: { id: uid }, limit: 1 } },
        });
        const existing =
            Array.isArray(q.profiles) && q.profiles.length > 0
                ? q.profiles[0]
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
        const profileData: any = {
            joined: new Date(),
            plan: "free",
            firstName,
            lastName,
        };
        
        // Store imageUrl as googlePicture if provided
        if (imageUrl) {
            profileData.googlePicture = imageUrl;
        }

        const res = await dbServer.transact([
            dbServer.tx.profiles[uid]
                .create(profileData)
                .link({ user: uid }),
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

    return { created: true, txId: createTxId };
}
