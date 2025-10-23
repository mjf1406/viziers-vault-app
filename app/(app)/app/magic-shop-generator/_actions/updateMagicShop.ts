/** @format */

"use client";

import db from "@/lib/db";
import type { GenerateMagicShopOpts } from "../_components/GenMagicShopResponsiveDialog";

export async function updateMagicShop(params: {
    id: string;
    name?: string | null;
    options?: GenerateMagicShopOpts;
}): Promise<void> {
    const { id, name, options: rawOptions } = params || ({} as any);
    if (!id || typeof id !== "string") throw new Error("Missing id");

    const update: any = { updatedAt: new Date() };
    if (typeof name === "string") update.name = name.trim() || undefined;
    if (rawOptions) {
        const {
            population,
            wealth,
            magicness,
            stockTypes,
            worldId,
            settlementId,
            overrideWealth,
            stockMultiplier,
        } = rawOptions as any;
        update.options = {
            population,
            wealth,
            magicLevel: magicness,
            stockTypes: Array.isArray(stockTypes) ? stockTypes : undefined,
            worldId: worldId || undefined,
            settlementId: settlementId || undefined,
            overrideWealth: overrideWealth || undefined,
            stockMultiplier:
                typeof stockMultiplier === "number" &&
                Number.isFinite(stockMultiplier)
                    ? stockMultiplier
                    : undefined,
        } as any;
    }

    await db.transact(db.tx.magicShops[id].update(update));
}
