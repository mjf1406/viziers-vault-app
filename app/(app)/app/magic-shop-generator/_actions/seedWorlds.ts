/** @format */

"use server";

import dbServer from "@/server/db-server";
import { randomUUID } from "crypto";

export async function seedPreMadeWorlds() {
    const preMade = [
        {
            name: "Toril (The Forgotten Realms)",
            settlements: [
                {
                    name: "Waterdeep",
                    population: 120000,
                    wealth: "opulent",
                    magicLevel: "high",
                },
                {
                    name: "Baldur's Gate",
                    population: 42000,
                    wealth: "prosperous",
                    magicLevel: "moderate",
                },
                {
                    name: "Neverwinter",
                    population: 23000,
                    wealth: "prosperous",
                    magicLevel: "high",
                },
            ],
        },
        {
            name: "Oerth (Greyhawk)",
            settlements: [
                {
                    name: "Greyhawk City",
                    population: 70000,
                    wealth: "prosperous",
                    magicLevel: "moderate",
                },
                {
                    name: "Dyvers",
                    population: 30000,
                    wealth: "modest",
                    magicLevel: "moderate",
                },
            ],
        },
        {
            name: "Krynn (Dragonlance)",
            settlements: [
                {
                    name: "Palanthas",
                    population: 60000,
                    wealth: "prosperous",
                    magicLevel: "high",
                },
                {
                    name: "Solace",
                    population: 4000,
                    wealth: "modest",
                    magicLevel: "low",
                },
            ],
        },
        {
            name: "Eberron",
            settlements: [
                {
                    name: "Sharn",
                    population: 212000,
                    wealth: "opulent",
                    magicLevel: "legendary",
                },
                {
                    name: "Stormreach",
                    population: 26000,
                    wealth: "prosperous",
                    magicLevel: "high",
                },
            ],
        },
        {
            name: "Athas (Dark Sun)",
            settlements: [
                {
                    name: "Tyr",
                    population: 15000,
                    wealth: "modest",
                    magicLevel: "low",
                },
                {
                    name: "Nibenay",
                    population: 14000,
                    wealth: "modest",
                    magicLevel: "low",
                },
            ],
        },
        {
            name: "Earth",
            settlements: [
                {
                    name: "Florence",
                    population: 366000,
                    wealth: "prosperous",
                    magicLevel: "low",
                },
                {
                    name: "Kyoto",
                    population: 1475000,
                    wealth: "opulent",
                    magicLevel: "low",
                },
            ],
        },
    ];

    const now = new Date();

    for (const w of preMade) {
        const worldId = randomUUID();
        await dbServer.transact([
            {
                op: "update",
                table: "worlds",
                id: worldId,
                args: { name: w.name, createdAt: now },
            },
        ] as any);

        for (const s of w.settlements) {
            await dbServer.transact([
                {
                    op: "update",
                    table: "settlements",
                    id: randomUUID(),
                    args: {
                        name: s.name,
                        population: s.population,
                        wealth: s.wealth,
                        magicLevel: s.magicLevel,
                        world: worldId,
                        createdAt: now,
                    },
                },
            ] as any);
        }
    }

    return { ok: true };
}
