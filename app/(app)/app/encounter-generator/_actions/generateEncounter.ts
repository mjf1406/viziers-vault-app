/** @format */

"use client";

import type { GenerateEncounterOpts } from "../_components/GenEncounterResponsiveDialog";
import db from "@/lib/db";
import { id } from "@instantdb/react";

export type GenerateEncounterInput = {
    name?: string | null;
    options: GenerateEncounterOpts | GenerateEncounterOpts[];
    quantity?: number | null;
};

export type GenerateEncounterResponse =
    | string[]
    | {
          encounters: Array<{
              name?: string | null;
              createdAt: Date;
              encounterCount: number;
              encounters: any[];
              options: any;
          }>;
      };

export default async function generateEncounter(
    input: GenerateEncounterInput,
    userId?: string | null
): Promise<GenerateEncounterResponse> {
    const createdAt = new Date();
    const name = input?.name?.trim() || undefined;
    const optionsArray = Array.isArray(input.options)
        ? input.options
        : [input.options];
    const canSave = Boolean(userId);

    console.log("generateEncounter options:", {
        name,
        optionsArray,
        canSave,
        userId,
    });

    const ids: string[] = [];
    const encountersPayload: Array<{
        name?: string | null;
        createdAt: Date;
        encounterCount: number;
        encounters: any[];
        options: any;
    }> = [];

    // Batch all creates into a single transaction
    const records: Array<{ id: string; record: any }> = [];

    for (const options of optionsArray) {
        const encounterId = id();

        // Placeholder: Generate encounter data
        // This will be replaced with actual encounter generation logic
        const encounterCount = Math.floor(Math.random() * 3) + 1; // 1-3 encounters
        const generatedEncounters = Array.from(
            { length: encounterCount },
            () => ({
                type: ["combat", "non-combat", "hazard"][
                    Math.floor(Math.random() * 3)
                ] as "combat" | "non-combat" | "hazard",
                description: "Placeholder encounter",
                cr: Math.floor(Math.random() * 5) + 1,
            })
        );

        const record: any = {
            createdAt,
            encounterCount,
            encounters: generatedEncounters,
            options: {
                biome: options.biome ?? null,
                travelPace: options.travelPace ?? null,
                road: options.road ?? null,
                travelMedium: options.travelMedium ?? null,
                time: options.time ?? null,
                season: options.season ?? null,
                climate: options.climate ?? null,
                quantity: optionsArray.length,
            },
        };

        // Only include name if it's provided
        if (name) {
            record.name = name;
        }

        records.push({ id: encounterId, record });
    }

    if (canSave && userId) {
        // Create each encounter in a separate transaction to avoid name uniqueness conflicts
        // Even though name isn't marked as unique, InstantDB seems to enforce uniqueness within a single transaction
        for (const { id: encounterId, record } of records) {
            await db.transact(
                db.tx.encounters[encounterId]
                    .create(record)
                    .link({ owner: userId })
            );
            ids.push(encounterId);
        }
    } else {
        records.forEach(({ record }) => {
            encountersPayload.push({
                name: record.name,
                createdAt: record.createdAt,
                encounterCount: record.encounterCount,
                encounters: record.encounters,
                options: record.options,
            });
        });
    }

    if (canSave && ids.length) return ids;
    return { encounters: encountersPayload };
}
