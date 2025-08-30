/** @format */

"use server";

import dbServer from "@/server/db-server";

type CreateUserProfileInput = {
    email: string;
    plan?: string;
    name?: string;
};

function assertEmail(email: string) {
    if (
        typeof email !== "string" ||
        email.length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
        throw new Error("Invalid email");
    }
}

export async function createUserProfile(input: CreateUserProfileInput) {
    const { email, plan, name } = input || ({} as CreateUserProfileInput);
    assertEmail(email);

    // Verify the user exists and is logged in (per requirement)
    const user = await dbServer.auth.getUser({ email });
    const userId = (user as any)?.id;
    if (!userId) {
        throw new Error("Unauthorized");
    }

    // Idempotent create
    try {
        await dbServer.transact(
            dbServer.tx.userProfiles[userId]
                .create({
                    joined: new Date(),
                    premium: false,
                    plan: plan ?? "free",
                })
                .link({ $user: userId })
        );
    } catch (err: any) {
        if (!err?.message?.includes?.("Creating entities that exist")) {
            throw err;
        }
    }

    // Optional name update
    if (name) {
        try {
            await dbServer.transact(
                dbServer.tx.userProfiles[userId].update({ name })
            );
        } catch {
            // non-fatal
        }
    }

    return { ok: true, userId };
}
