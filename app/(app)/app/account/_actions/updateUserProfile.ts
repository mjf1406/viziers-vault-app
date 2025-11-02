/** @format */
// server_actions/updateUserProfile.ts
"use server";

import dbServer from "@/server/db-server";

type Plan = "free" | "basic" | "plus" | "pro" | null;

export type UpdateUserProfileParams = {
    // user.refresh_token from the client
    token: string;

    // Optional fields to update
    plan?: Plan | undefined;
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
 * Update a profiles row for this user.
 * - Auth: verifies refresh_token and scopes queries to that user.
 * - NOTE: this no longer creates a profile if missing; it will fail if the
 *   profile does not exist.
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

    // Prepare partial update
    const update: Record<string, any> = {};
    const updatedFields: Array<keyof Omit<UpdateUserProfileParams, "token">> =
        [];

    if ("plan" in params) {
        // plan can be "free" | "basic" | "plus" | "pro" | null
        update.plan = params.plan ?? null;
        updatedFields.push("plan");
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
        // Nothing to update
        return { success: true, updatedFields: [] };
    }

    try {
        const res = await scopedDb.transact([
            scopedDb.tx.profiles[uid].update(update),
        ]);
        return {
            success: true,
            txId: (res as any)["tx-id"],
            updatedFields,
        };
    } catch (err: any) {
        // Propagate a clear failure message (profile probably missing or perms)
        const msg = String(err?.message ?? "Failed to update profile");
        return { success: false, error: msg };
    }
}
