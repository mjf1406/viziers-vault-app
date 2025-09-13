/** @format */

"use client";

import { useEffect, useRef } from "react";
import db from "@/lib/db";
import { normalizeTier } from "@/lib/ratelimit";

export default function SessionCookieSync() {
    const sentRef = useRef<string | null>(null);
    const { user } = db.useAuth();
    const { data } = db.useQuery({ $users: { profile: {} } });
    const profile = data?.$users?.[0]?.profile;
    const lastRlRef = useRef<string | null>(null);

    useEffect(() => {
        const uid = (user as any)?.id as string | undefined;
        const planRaw = (profile?.plan as string | undefined) ?? null;
        const plan = normalizeTier(planRaw);
        if (!uid) return;
        const payload = `${uid}:${plan}`;
        if (sentRef.current === payload) return;
        sentRef.current = payload;
        void fetch("/api/session/sync", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ userId: uid, plan }),
        }).catch(() => {});
    }, [user?.id, profile?.plan]);

    // Read and clear a short-lived rate-limit message cookie to show a toast
    useEffect(() => {
        if (typeof document === "undefined") return;
        const cookieStr = document.cookie || "";
        const match = cookieStr.match(/(?:^|; )vv_rl_msg=([^;]+)/);
        if (!match) return;
        try {
            const raw = decodeURIComponent(match[1]);
            if (raw && lastRlRef.current !== raw) {
                lastRlRef.current = raw;
                // eslint-disable-next-line no-console
                console.error(raw);
                // Lightweight dynamic import to avoid bundling sonner here if unavailable
                import("sonner")
                    .then(({ toast }) => toast.error(raw))
                    .catch(() => {});
            }
        } finally {
            // Clear cookie
            document.cookie = "vv_rl_msg=; path=/; max-age=0";
        }
    });

    return null;
}
