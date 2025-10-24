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
        const record: any = {
            name,
            createdAt,
            // options,
            creatorId: uid,
        };

        await db.transact(
            db.tx.magicShops[id].create(record).link({ $user: uid })
        );
        ids.push(id);
    }

    return ids;
}
