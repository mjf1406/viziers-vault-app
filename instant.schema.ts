/** @format */

// Docs: https://www.instantdb.com/docs/modeling-data

// instant.schema.ts

import { i } from "@instantdb/react";

const _schema = i.schema({
    entities: {
        // ----------------------
        //      Admin Tables
        // ----------------------

        $files: i.entity({
            path: i.string().unique().indexed(),
            url: i.string(),
        }),
        $users: i.entity({
            email: i.string().unique().indexed().optional(),
        }),
        userProfiles: i.entity({
            joined: i.date().optional(),
            premium: i.boolean().optional(),
            plan: i.string().optional(), // "free", "basic", "plus", "pro" :::: null = free
            name: i.string().optional(),
        }),

        // ----------------------
        //      Data Tables
        // ----------------------

        dnd5e_magicItems: i.entity({
            // D&D Beyond primary key
            dndbeyondId: i.string().unique().indexed(),

            // Naming
            name: i.string().indexed(),
            nameLower: i.string().optional().indexed(),
            slug: i.string().optional().indexed(),

            // Item data
            rarity: i.string().optional().indexed(),
            type: i.string().optional().indexed(),
            attunement: i.string().optional().indexed(),
            notes: i.string().optional(),

            // Provenance
            source: i.string().optional().indexed(),
            sourceShort: i.string().optional().indexed(),
            url: i.string().optional(),

            // Timestamps
            createdAt: i.date().optional().indexed(),
            updatedAt: i.date().optional().indexed(),
        }),
        dnd5e_spells: i.entity({
            // D&D Beyond primary key
            dndbeyondId: i.string().unique().indexed(),

            // Naming
            name: i.string().optional().indexed(),
            nameLower: i.string().optional().indexed(),
            slug: i.string().optional().indexed(),

            // Spell data
            levelText: i.string().optional(),
            level: i.number().optional().indexed(),
            castingTime: i.string().optional().indexed(),
            range: i.string().optional().indexed(),
            area: i.string().optional().indexed(),
            areaShape: i.string().optional().indexed(),
            components: i.string().optional().indexed(),
            materialComponents: i.string().optional(),
            duration: i.string().optional().indexed(),
            school: i.string().optional().indexed(),
            attackSave: i.string().optional(),
            damageEffect: i.string().optional(),
            classes: i.json().optional().indexed(),

            // Provenance
            source: i.string().optional().indexed(),
            sourceShort: i.string().optional().indexed(),
            url: i.string().optional(),

            // Timestamps
            createdAt: i.date().optional().indexed(),
            updatedAt: i.date().optional().indexed(),
        }),

        dnd5e_bestiary: i.entity({
            // D&D Beyond primary key
            dndbeyondId: i.string().unique().indexed(),

            // Naming
            name: i.string().optional().indexed(), // e.g. 'The Demogorgon' (unescaped)
            nameLower: i.string().optional().indexed(), // e.g. 'the demogorgon' (unescaped, lower case)
            slug: i.string().optional().indexed(), // e.g. 'the-demogorgon' (escaped)

            // Stat block basics
            crText: i.string().optional(), // e.g. "1/2", "8"
            cr: i.number().optional().indexed(), // numeric form when parsable (0.5 for "1/2")
            type: i.string().optional().indexed(), // e.g. "Giant"
            size: i.string().optional().indexed(), // e.g. "Large"
            alignment: i.string().optional().indexed(),
            habitat: i.string().optional().indexed(),

            // Provenance
            source: i.string().optional().indexed(),
            sourceShort: i.string().optional().indexed(),
            url: i.string().optional(),

            // Timestamps
            createdAt: i.date().optional().indexed(),
            updatedAt: i.date().optional().indexed(),
        }),

        // ----------------------
        //      User Tables
        // ----------------------

        todos: i.entity({
            createdAt: i.number().optional(),
            done: i.boolean().optional(),
            text: i.string().optional(),
        }),
        settings: i.entity({
            urlPreferences: i.json().optional(),
        }),
        battleMaps: i.entity({}),
        parties: i.entity({
            name: i.string(),
            pcs: i.json(), // [{level: 1, quantity: 3}] - this means there are three level-one PCs
            createdAt: i.date(),
            updatedAt: i.date().optional(),
            creatorId: i.string().indexed(),
        }),
        encounters: i.entity({}),
        spellbooks: i.entity({
            name: i.string().optional(),
            createdAt: i.date().optional().indexed(),
            updatedAt: i.date().optional().indexed(),
            options: i.json().optional(),
            spellCount: i.number().optional(),
            spells: i.json().optional(),
            creatorId: i.string().optional().indexed(),
        }),
        magicShops: i.entity({}),
        worlds: i.entity({
            name: i.string(),
            createdAt: i.date().optional().indexed(),
            updatedAt: i.date().optional().indexed(),
            creatorId: i.string().optional().indexed(),
            isPremade: i.boolean().optional().indexed(),
        }),
        settlements: i.entity({
            name: i.string(),
            population: i.number().optional().indexed(),
            wealth: i.string().optional().indexed(), // poor, modest, prosperous, opulent
            magicness: i.string().optional().indexed(), // low, moderate, high, legendary
            shopTypes: i.json().optional(), // ["magic", "general", ...]
            createdAt: i.date().optional().indexed(),
            updatedAt: i.date().optional().indexed(),
            creatorId: i.string().optional().indexed(),
            isPremade: i.boolean().optional().indexed(),
        }),
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
        settingsUser: {
            forward: { on: "settings", has: "one", label: "$user" },
            reverse: { on: "$users", has: "many", label: "settings" },
        },
        worldsUser: {
            forward: { on: "worlds", has: "one", label: "$user" },
            reverse: { on: "$users", has: "many", label: "worlds" },
        },
        settlementsUser: {
            forward: { on: "settlements", has: "one", label: "$user" },
            reverse: { on: "$users", has: "many", label: "settlements" },
        },
        settlementsWorld: {
            forward: { on: "settlements", has: "one", label: "world" },
            reverse: { on: "worlds", has: "many", label: "settlements" },
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
