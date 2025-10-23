/** @format */

"use server";

import dbServer from "@/server/db-server";
import { getAuthAndSaveEligibility } from "@/server/auth";
import { PREMADE_WORLDS } from "@/lib/pre-made-worlds";
import { randomUUID } from "crypto";

// Seeds PREMADE_WORLDS into the current user's DB, linking to $user and marking isPremade
export async function seedPreMadeWorlds() {
    const { uid, canSave } = await getAuthAndSaveEligibility();
    if (!uid || !canSave) {
        throw new Error("You must be a paid user to save worlds");
    }

    // If already seeded, do nothing (idempotent-ish by user)
    const existing = (await dbServer.query({
        worlds: { $: { where: { creatorId: uid, isPremade: true } } },
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
                    creatorId: uid,
                    isPremade: true,
                })
                .link({ $user: uid })
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
                        creatorId: uid,
                        isPremade: true,
                    })
                    .link({ $user: uid, world: worldId })
            );
        }
    }

    return { ok: true, alreadySeeded: false } as const;
}
