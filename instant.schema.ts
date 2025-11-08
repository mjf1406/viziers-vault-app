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
            imageURL: i.string().optional(),
            type: i.string().optional(),
        }),
        profiles: i.entity({
            joined: i.date(),
            plan: i.string(),
            firstName: i.string(),
            lastName: i.string(),
            googlePicture: i.string().optional(),
            subscriptionPeriodStart: i.date().optional(),
            subscriptionPeriodEnd: i.date().optional(),
            subscriptionCost: i.number().optional(),
            trialPeriodStart: i.date().optional(),
            trialPeriodEnd: i.date().optional(),
            recurringInterval: i.string().optional(),
            recurringIntervalCount: i.number().optional(),
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
            componentCost: i.number().optional(),
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
            habitat: i.string().optional().indexed(), // D&D habitat (e.g. "Arctic", "Forest")
            biome: i.json().optional().indexed(), // Array of biome strings
            travelMedium: i.json().optional().indexed(), // Array of "land", "water", "air"

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
        settings: i.entity({
            urlPreferences: i.json().optional(),
            // Generator settings (Magic Shop, etc.)
            slotBeta: i.number().optional(),
            slotScale: i.number().optional(),
            wealthInfluence: i.number().optional(),
            maxPriceChange: i.number().optional(),
            rarityProgressionExponent: i.number().optional(),
            magicRarityBias: i.number().optional(),
            rarityPopulationGating: i.string().optional(), // "strict" | "soft" | "none"
            basePrices: i.json().optional(),
            rarityThresholds: i.json().optional(),
            spellScrollPrices: i.json().optional(),
            // Spellbook generator settings
            spellbookExtraSpellsDice: i.string().optional(),
        }),
        parties: i.entity({
            name: i.string(),
            pcs: i.json(), // [{level: 1, quantity: 3}] - this means there are three level-one PCs
            createdAt: i.date(),
            updatedAt: i.date().optional(),
        }),
        settlements: i.entity({
            name: i.string(),
            population: i.number().optional().indexed(),
            wealth: i.string().optional().indexed(), // poor, modest, prosperous, opulent
            magicness: i.string().optional().indexed(), // low, moderate, high, legendary
            shopTypes: i.json().optional(), // ["magic", "general", ...]
            createdAt: i.date().optional().indexed(),
            updatedAt: i.date().optional().indexed(),
            isPremade: i.boolean().optional().indexed(),
        }),
        todos: i.entity({
            text: i.string(),
            done: i.boolean(),
            createdAt: i.date().optional(),
        }),
        // ----------------------
        //    Generator Tables
        // ----------------------
        battleMaps: i.entity({}),
        encounters: i.entity({
            name: i.string().optional(),
            createdAt: i.date(),
            updatedAt: i.date().optional().indexed(),
            options: i.json().optional(),
            encounterCount: i.number().optional(),
            encounters: i.json().optional(),
        }),
        spellbooks: i.entity({
            name: i.string().optional(),
            createdAt: i.date(),
            updatedAt: i.date().optional().indexed(),
            options: i.json().optional(),
            spellCount: i.number().optional(),
            spells: i.json().optional(),
        }),
        magicShops: i.entity({
            name: i.string(),
            createdAt: i.date().optional(),
            updatedAt: i.date().optional(),
            items: i.json().optional(),
            options: i.json().optional(),
        }),
        worlds: i.entity({
            name: i.string(),
            createdAt: i.date().optional().indexed(),
            updatedAt: i.date().optional().indexed(),
            isPremade: i.boolean().optional().indexed(),
        }),
        starSystems: i.entity({
            name: i.string(),
            createdAt: i.date().optional().indexed(),
            updatedAt: i.date().optional().indexed(),
            isPremade: i.boolean().optional().indexed(),
        }),
        galaxies: i.entity({
            name: i.string(),
            createdAt: i.date().optional().indexed(),
            updatedAt: i.date().optional().indexed(),
            isPremade: i.boolean().optional().indexed(),
        }),
    },
    links: {
        // ----------------------
        //      Admin Tables
        // ----------------------
        $usersLinkedPrimaryUser: {
            forward: {
                on: "$users",
                has: "one",
                label: "linkedPrimaryUser",
                onDelete: "cascade",
            },
            reverse: {
                on: "$users",
                has: "many",
                label: "linkedGuestUsers",
            },
        },
        userProfiles: {
            forward: {
                on: "profiles",
                has: "one",
                label: "user",
            },
            reverse: {
                on: "$users",
                has: "one",
                label: "profile",
            },
        },
        // ----------------------
        //      User Tables
        // ----------------------
        settingsOwners: {
            forward: {
                // This adds a column to the settings table called owner, wherein the userId is stored.
                on: "settings",
                has: "one",
                label: "owner",
                onDelete: "cascade",
            },
            reverse: {
                // This adds a column to the users table called settings, wherein the settingsId is stored.
                on: "$users",
                has: "one",
                label: "settings",
            },
        },
        partiesOwners: {
            forward: {
                // This adds a column to the parties table called owner, wherein the userId is stored.
                on: "parties",
                has: "one",
                label: "owner",
                onDelete: "cascade",
            },
            reverse: {
                // This adds a column to the users table called parties, wherein [partiesId] is stored.
                on: "$users",
                has: "many",
                label: "parties",
            },
        },
        settlementsOwners: {
            forward: {
                // This adds a column to the settlements table called owner, wherein the userId is stored.
                on: "settlements",
                has: "one",
                label: "owner",
                onDelete: "cascade",
            },
            reverse: {
                // This adds a column to the users table called settlements, wherein [settlementsId] is stored.
                on: "$users",
                has: "many",
                label: "settlements",
            },
        },
        partiesFiles: {
            forward: {
                on: "parties",
                has: "one",
                label: "icon",
                onDelete: "cascade",
            },
            reverse: {
                on: "$files",
                has: "one",
                label: "party",
            },
        },
        // ----------------------------
        //    Generator Table Owners
        // ----------------------------
        battleMapsOwners: {
            forward: {
                // This adds a column to the battleMaps table called owner, wherein the userId is stored.
                on: "battleMaps",
                has: "one",
                label: "owner",
                onDelete: "cascade",
            },
            reverse: {
                // This adds a column to the users table called battleMaps, wherein [battleMapsId] is stored.
                on: "$users",
                has: "many",
                label: "battleMaps",
            },
        },
        encountersOwners: {
            forward: {
                on: "encounters",
                has: "one",
                label: "owner",
                onDelete: "cascade",
            },
            reverse: {
                on: "$users",
                has: "many",
                label: "encounters",
            },
        },
        spellbooksOwners: {
            forward: {
                on: "spellbooks",
                has: "one",
                label: "owner",
                onDelete: "cascade",
            },
            reverse: {
                on: "$users",
                has: "many",
                label: "spellbooks",
            },
        },
        magicShopsOwners: {
            forward: {
                on: "magicShops",
                has: "one",
                label: "owner",
                onDelete: "cascade",
            },
            reverse: {
                on: "$users",
                has: "many",
                label: "magicShops",
            },
        },
        worldsOwners: {
            forward: {
                on: "worlds",
                has: "one",
                label: "owner",
                onDelete: "cascade",
            },
            reverse: {
                on: "$users",
                has: "many",
                label: "worlds",
            },
        },
        starSystemsOwners: {
            forward: {
                on: "starSystems",
                has: "one",
                label: "owner",
                onDelete: "cascade",
            },
            reverse: {
                on: "$users",
                has: "many",
                label: "starSystems",
            },
        },
        galaxiesOwners: {
            forward: {
                on: "galaxies",
                has: "one",
                label: "owner",
                onDelete: "cascade",
            },
            reverse: {
                on: "$users",
                has: "many",
                label: "galaxies",
            },
        },
        // -----------------------------------
        //    Generator Table Relationships
        // -----------------------------------
        settlementsWorld: {
            forward: {
                on: "settlements",
                has: "one",
                label: "world",
                onDelete: "cascade",
            },
            reverse: {
                on: "worlds",
                has: "many",
                label: "settlements",
            },
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
