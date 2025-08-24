/** @format */

// lib/db.ts
import schema from "@/instant.schema";
import { init } from "@instantdb/react";

const APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID;

if (!APP_ID) {
    throw new Error(
        "Missing NEXT_PUBLIC_INSTANT_APP_ID. Did you set it in .env.local / Vercel?"
    );
}

const db = init({ appId: APP_ID, schema });

export default db;
