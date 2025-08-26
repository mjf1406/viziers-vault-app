/** @format */

// Docs: https://www.instantdb.com/docs/modeling-data

// instant.schema.ts

import { i } from "@instantdb/react";

const _schema = i.schema({
    entities: {
        $files: i.entity({
            path: i.string().unique().indexed(),
            url: i.string(),
        }),
        $users: i.entity({
            email: i.string().unique().indexed().optional(),
        }),
        settings: i.entity({}),
        userProfiles: i.entity({
            joined: i.date().optional(),
            premium: i.boolean().optional(),
            name: i.string().optional(),
        }),

        dnd5e_magicItems: i.entity({}),
        dnd5e_spells: i.entity({}),
        dnd5e_bestiary: i.entity({}),

        todos: i.entity({
            createdAt: i.number().optional(),
            done: i.boolean().optional(),
            text: i.string().optional(),
        }),

        battleMaps: i.entity({}),
        parties: i.entity({
            name: i.string(),
            pcs: i.json(), // [{l: 1, q: 3}] - this means there are 3 level one PCs
            createdAt: i.date(),
            updatedAt: i.date().optional(),
            creatorId: i.string(),
        }),
        encounters: i.entity({}),
        spellbooks: i.entity({}),
        magicShops: i.entity({}),
        worlds: i.entity({}),
        starSystems: i.entity({}),
        galaxies: i.entity({}),
    },
    links: {
        // One-to-many from $users -> each new entity
        battleMapsUser: {
            forward: { on: "battleMaps", has: "one", label: "$user" },
            reverse: { on: "$users", has: "many", label: "battleMaps" },
        },
        partiesUser: {
            forward: { on: "parties", has: "one", label: "$user" },
            reverse: { on: "$users", has: "many", label: "parties" },
        },
        encountersUser: {
            forward: { on: "encounters", has: "one", label: "$user" },
            reverse: { on: "$users", has: "many", label: "encounters" },
        },
        spellbooksUser: {
            forward: { on: "spellbooks", has: "one", label: "$user" },
            reverse: { on: "$users", has: "many", label: "spellbooks" },
        },
        magicShopsUser: {
            forward: { on: "magicShops", has: "one", label: "$user" },
            reverse: { on: "$users", has: "many", label: "magicShops" },
        },
        worldsUser: {
            forward: { on: "worlds", has: "one", label: "$user" },
            reverse: { on: "$users", has: "many", label: "worlds" },
        },
        starSystemsUser: {
            forward: { on: "starSystems", has: "one", label: "$user" },
            reverse: { on: "$users", has: "many", label: "starSystems" },
        },
        galaxiesUser: {
            forward: { on: "galaxies", has: "one", label: "$user" },
            reverse: { on: "$users", has: "many", label: "galaxies" },
        },
        userProfilesUser: {
            forward: { on: "userProfiles", has: "one", label: "$user" },
            reverse: { on: "$users", has: "one", label: "profile" },
        },
        partiesFiles: {
            forward: { on: "parties", has: "one", label: "$files" },
            reverse: { on: "$files", has: "one", label: "party" },
        },
        userProfilesFiles: {
            forward: { on: "userProfiles", has: "one", label: "$files" },
            reverse: { on: "$files", has: "one", label: "avatar" },
        },
    },
    rooms: {
        todos: {
            presence: i.entity({}),
        },
    },
});

// This helps Typescript display nicer intellisense
type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
