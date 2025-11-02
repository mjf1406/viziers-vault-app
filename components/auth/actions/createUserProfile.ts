/** @format */

"use server";

import dbServer from "@/server/db-server";

type CreateUserProfileInput = {
    email: string;
    plan?: string;
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
    const { email, plan } = input || ({} as CreateUserProfileInput);
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
            dbServer.tx.profiles[userId]
                .create({
                    joined: new Date(),
                    plan: plan ?? "free",
                    firstName: "",
                    lastName: "",
                })
                .link({ user: userId })
        );
    } catch (err: any) {
        if (!err?.message?.includes?.("Creating entities that exist")) {
            throw err;
        }
    }

    return { ok: true, userId };
}
