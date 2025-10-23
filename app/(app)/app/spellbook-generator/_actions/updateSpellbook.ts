/** @format */

"use client";

import db from "@/lib/db";

export async function updateSpellbook(params: {
    id: string;
    name?: string | null;
}): Promise<void> {
    const { id, name } = params || ({} as any);
    if (!id || typeof id !== "string") throw new Error("Missing id");
    await db.transact(
        db.tx.spellbooks[id].update({
            name: (name || "").trim() || undefined,
            updatedAt: new Date(),
        })
    );
}
