/** @format */

import dbServer from "@/server/db-server";
import { cookies } from "next/headers";
import { verifyHint } from "@/lib/hint";

export type AllowedPlan = "free" | "basic" | "plus" | "pro";

export async function getAuthAndSaveEligibility(): Promise<{
    uid: string;
    canSave: boolean;
    userIdForSave: string | null;
    tier: AllowedPlan | null;
}> {
    const cookieStore = await cookies();
    const hintRaw = cookieStore.get("vv_hint")?.value ?? "";
    const secret = process.env.VV_COOKIE_SECRET || "";
    const hint = secret && hintRaw ? await verifyHint(hintRaw, secret) : null;
    const uid = hint?.uid ?? "";

    if (process.env.VV_DEBUG) {
        // eslint-disable-next-line no-console
        console.log(
            "auth helper:",
            "uid=",
            uid || "(empty)",
            "tier=",
            hint?.tier || "(none)",
            "hasSecret=",
            !!secret,
            "hasCookie=",
            !!hintRaw,
            "hintValid=",
            !!hint
        );
    }

    let canSave = false;
    let userIdForSave: string | null = null;
    let tier: AllowedPlan | null = null;

    try {
        if (uid) {
            const users = await dbServer.query({
                $users: { $: { where: { id: uid } }, profile: {} },
            });
            const userInfo = (users as any)?.$users?.[0];
            const planRaw = userInfo?.profile?.plan as string | undefined;
            const allowed: AllowedPlan[] = ["free", "basic", "plus", "pro"];
            const normalized = (planRaw || "free").toLowerCase();
            tier = allowed.includes(normalized as AllowedPlan)
                ? (normalized as AllowedPlan)
                : null;
            const isPremium =
                tier === "basic" || tier === "plus" || tier === "pro";
            canSave = Boolean(uid) && isPremium;
            userIdForSave = uid;
        }
    } catch (e) {
        if (process.env.VV_DEBUG) {
            // eslint-disable-next-line no-console
            console.error("auth helper user lookup error:", e);
        }
        canSave = false;
        userIdForSave = null;
    }

    return { uid, canSave, userIdForSave, tier };
}
