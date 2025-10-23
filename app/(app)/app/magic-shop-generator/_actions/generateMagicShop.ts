/** @format */

// "use server";

import dbServer from "@/server/db-server";
// import { getAuthAndSaveEligibility } from "@/server/auth";
import { randomUUID } from "crypto";
import type { GenerateMagicShopOpts } from "../_components/GenMagicShopResponsiveDialog";

function buildOptions(opts: GenerateMagicShopOpts) {
    const {
        population,
        wealth,
        magicness,
        stockTypes,
        worldId,
        settlementId,
        // overrideWealth,
        stockMultiplier,
    } = opts;
    return {
        population,
        wealth,
        magicLevel: magicness,
        stockTypes: Array.isArray(stockTypes) ? stockTypes : undefined,
        worldId: worldId || undefined,
        settlementId: settlementId || undefined,
        // overrideWealth: overrideWealth || undefined,
        stockMultiplier: stockMultiplier ?? 1,
    } as any;
}

export type GenerateMagicShopInput = {
    name?: string | null;
    options: GenerateMagicShopOpts;
    quantity?: number | null;
};

export default async function generateMagicShop(
    input: GenerateMagicShopInput
): Promise<string[]> {
    // const { uid, canSave } = await getAuthAndSaveEligibility();

    // if (!uid || !canSave) {
    //     throw new Error("You must be a paid user to save magic shops");
    // }

    const createdAt = new Date();
    const qtyRaw = input?.quantity ?? 1;
    const qty = Math.min(10, Math.max(1, Number(qtyRaw) || 1));
    const name = input?.name?.trim() || undefined;
    const options = buildOptions(input.options);

    console.log("Magic Shop", { name, qty, options });

    const ids: string[] = [];
    return ids;

    for (let i = 0; i < qty; i++) {
        const id = randomUUID();
        const record: any = {
            name,
            createdAt,
            options,
            creatorId: uid,
        };

        await dbServer.transact(
            dbServer.tx.magicShops[id].create(record).link({ $user: uid })
        );
        ids.push(id);
    }

    return ids;
}
