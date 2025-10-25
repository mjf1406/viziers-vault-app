/** @format */

"use client";

import db from "@/lib/db";
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
        inputMode,
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
        inputMode:
            inputMode || (population ? "by-population" : "by-settlement"),
    } as any;
}

export type GenerateMagicShopInput = {
    name?: string | null;
    options: GenerateMagicShopOpts;
    quantity?: number | null;
};

export default async function generateMagicShop(
    input: GenerateMagicShopInput,
    user?: { id?: string | null; plan?: string | null }
): Promise<string[]> {
    const uid = user?.id ?? null;
    if (!uid) {
        throw new Error("You must be logged in to save magic shops");
    }

    const createdAt = new Date();
    const qtyRaw = input?.quantity ?? 1;
    const qty = Math.min(10, Math.max(1, Number(qtyRaw) || 1));
    const name = input?.name?.trim() || undefined;
    const options = buildOptions(input.options);
    console.log("generateMagicShop options:", { name, options, qty, user });

    const ids: string[] = [];

    for (let i = 0; i < qty; i++) {
        const id =
            (globalThis as any)?.crypto?.randomUUID?.() ??
            Math.random().toString(36).slice(2);

        const items = await generateMagicShopItems(options);

        const record: any = {
            name,
            createdAt,
            items,
            creatorId: uid,
        };

        await db.transact(
            db.tx.magicShops[id].create(record).link({ $user: uid })
        );
        ids.push(id);
    }

    return ids;
}

// {
//     "name": "Luthien's Dusty Phylactery",
//     "options": {
//         "population": null,
//         "wealth": 1,
//         "magicLevel": 3,
//         "stockTypes": [
//             "scrolls",
//             "potions"
//         ],
//         "worldId": "d5143afb-eb9d-4a09-8bb0-0ef4e9ec0849",
//         "settlementId": "0a9bb915-1b5b-4780-bbd2-7ef69efd9100",
//         "stockMultiplier": 1,
//         "inputMode": "by-settlement"
//     },
//     "qty": 1,
//     "user": {
//         "id": "0907147e-b057-4130-a12f-bc5b1d851cbd",
//         "plan": "Pro"
//     }
// }

async function generateMagicShopItems(options: any): Promise<any[]> {
    const {
        population,
        wealth,
        magicLevel,
        stockTypes,
        stockMultiplier,
        worldId,
        settlementId,
        inputMode,
    } = options;

    return [];
}
