/** @format */

"use client";

import db from "@/lib/db";

export async function signOutAndClearSession() {
    try {
        await db.auth.signOut();
    } finally {
        try {
            await fetch("/api/session/clear", { method: "POST" });
        } catch {}
    }
}
