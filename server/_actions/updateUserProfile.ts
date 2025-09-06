/** @format */
// server\_actions\updateUserProfile.ts
"use server";

import dbServer from "../db-server";

type Plan = "free" | "basic" | "plus" | "pro" | null;

export type UpdateUserProfileParams = {
    // user.refresh_token from the client
    token: string;

    // Optional fields to update
    name?: string | null;
    plan?: Plan | undefined;
    premium?: boolean | null;
    joined?: Date | string | null;
};

export type UpdateUserProfileResult =
    | {
          success: true;
          txId?: string;
          updatedFields: Array<keyof Omit<UpdateUserProfileParams, "token">>;
      }
    | {
          success: false;
          error: string;
      };

/**
 * Ensures a userProfiles row exists for this user and updates provided fields.
 * - Auth: verifies refresh_token and scopes queries to that user.
 * - Creates userProfiles[id] if missing, linking to $user.
 */
export async function updateUserProfile(
    params: UpdateUserProfileParams
): Promise<UpdateUserProfileResult> {
    const { token } = params;
    if (!token || typeof token !== "string") {
        throw new Error("Unauthorized: missing token");
    }

    const user = await dbServer.auth.verifyToken(token);
    if (!user?.id) {
        throw new Error("Unauthorized: invalid token");
    }

    const scopedDb = dbServer.asUser({ token });
    const uid = user.id as string;

    // Create if missing (ignore "exists" error)
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
            return { success: false, error: "Failed to ensure profile exists" };
        }
    }

    // Prepare partial update
    const update: Record<string, any> = {};
    const updatedFields: Array<keyof Omit<UpdateUserProfileParams, "token">> =
        [];

    if ("name" in params) {
        update.name = params.name ?? null;
        updatedFields.push("name");
    }
    if ("plan" in params) {
        // plan can be "free" | "basic" | "plus" | "pro" | null
        update.plan = params.plan ?? null;
        updatedFields.push("plan");
    }
    if ("premium" in params) {
        update.premium = params.premium ?? null;
        updatedFields.push("premium");
    }
    if ("joined" in params) {
        const j = params.joined;
        if (j instanceof Date) {
            update.joined = j;
        } else if (typeof j === "string") {
            const d = new Date(j);
            if (!Number.isNaN(d.getTime())) {
                update.joined = d;
            } else {
                return { success: false, error: "Invalid joined date string" };
            }
        } else {
            update.joined = null;
        }
        updatedFields.push("joined");
    }

    if (Object.keys(update).length === 0) {
        // Nothing to update; still considered success since we ensured existence
        return { success: true, updatedFields: [] };
    }

    try {
        const res = await scopedDb.transact([
            scopedDb.tx.userProfiles[uid].update(update),
        ]);
        return {
            success: true,
            txId: (res as any)["tx-id"],
            updatedFields,
        };
    } catch {
        return { success: false, error: "Failed to update profile" };
    }
}
