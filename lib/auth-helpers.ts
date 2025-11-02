/** @format */

"use client";

import db from "@/lib/db";

export async function signOutAndClearSession() {
    await db.auth.signOut();
}
