/** @format */

"use server";

import dbServer from "@/server/db-server";
import { PREMADE_WORLDS } from "@/lib/pre-made-worlds";
import { randomUUID } from "crypto";

// Seeds PREMADE_WORLDS into the current user's DB, linking to $user and marking isPremade
export async function seedPreMadeWorlds(token: string) {
    if (!token || typeof token !== "string") {
        throw new Error("Unauthorized: missing token");
    }

    // Verify the refresh token using InstantDB
    const user = await dbServer.auth.verifyToken(token);
    if (!user?.id) {
        throw new Error("Unauthorized: invalid token");
    }

    const uid = user.id as string;

    // Query user profile to check if they have a premium plan
    const users = await dbServer.query({
        $users: { $: { where: { id: uid } }, profile: {} },
    });
    const userInfo = (users as any)?.$users?.[0];
    const planRaw = userInfo?.profile?.plan as string | undefined;
    const normalized = (planRaw || "free").toLowerCase();
    const isPremium = ["basic", "plus", "pro"].includes(normalized);

    if (!isPremium) {
        throw new Error("You must be a paid user to save worlds");
    }

    // If already seeded, do nothing (idempotent-ish by user)
    // Query via owner link to check for existing premade worlds
    const existing = (await dbServer.query({
        worlds: { $: { where: { "owner.id": uid, isPremade: true } } },
    })) as any;
    const alreadySeeded = (existing?.worlds ?? []).length > 0;
    if (alreadySeeded) {
        return { ok: true, alreadySeeded: true } as const;
    }

    const now = new Date();

    for (const w of PREMADE_WORLDS) {
        const worldId = randomUUID();
        await dbServer.transact(
            dbServer.tx.worlds[worldId]
                .create({
                    name: w.name,
                    createdAt: now,
                    isPremade: true,
                })
                .link({ owner: uid })
        );

        for (const s of w.settlements ?? []) {
            const settlementId = randomUUID();
            await dbServer.transact(
                dbServer.tx.settlements[settlementId]
                    .create({
                        name: s.name,
                        population: s.population,
                        wealth: s.wealth as any,
                        magicness: s.magicness as any,
                        shopTypes: s.shopTypes as any,
                        createdAt: now,
                        isPremade: true,
                    })
                    .link({ owner: uid, world: worldId })
            );
        }
    }

    return { ok: true, alreadySeeded: false } as const;
}
