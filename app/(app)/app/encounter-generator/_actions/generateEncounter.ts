/** @format */

"use client";

import type { GenerateEncounterOpts } from "../_components/RollEncounterDialog";
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

    // Combine all instances into a single encounter record
    // Collect all generated encounters from all instances
    const allGeneratedEncounters: any[] = [];
    const allOptions: any[] = [];

    // Generate encounters for each instance and collect them
    for (const options of optionsArray) {
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

        allGeneratedEncounters.push(...generatedEncounters);
        allOptions.push({
            biome: options.biome ?? null,
            travelPace: options.travelPace ?? null,
            road: options.road ?? null,
            travelMedium: options.travelMedium ?? null,
            time: options.time ?? null,
            season: options.season ?? null,
            climate: options.climate ?? null,
        });
    }

    // Create a single record with all encounters combined
    const encounterId = id();
    const record: any = {
        createdAt,
        encounterCount: allGeneratedEncounters.length,
        encounters: allGeneratedEncounters,
        options: {
            instances: allOptions,
            quantity: optionsArray.length,
        },
    };

    // Only include name if it's provided
    if (name) {
        record.name = name;
    }

    if (canSave && userId) {
        await db.transact(
            db.tx.encounters[encounterId].create(record).link({ owner: userId })
        );
        return [encounterId];
    } else {
        return {
            encounters: [
                {
                    name: record.name,
                    createdAt: record.createdAt,
                    encounterCount: record.encounterCount,
                    encounters: record.encounters,
                    options: record.options,
                },
            ],
        };
    }
}
