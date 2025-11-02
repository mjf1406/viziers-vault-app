/** @format */

// Docs: https://www.instantdb.com/docs/permissions

// instant.perms.ts

import type { InstantRules } from "@instantdb/react";

const adminBind = [
    "isAuthenticated",
    "auth.id != null",
    "isCreator",
    "auth.id != null && auth.id == data.creatorId",
    "isStillCreator",
    "auth.id != null && auth.id == newData.creatorId",
    "isOwner",
    "auth.id != null && auth.id == data.id",
    "isStillOwner",
    "auth.id != null && auth.id == newData.id",
    "isPremium",
    "auth.ref('$user.profile.plan').exists(p, p in ['basic', 'plus', 'pro'])",
];

const dataBind = [
    "isAuthenticated",
    "auth.id != null",
    "isOwner",
    "data.owner == auth.id",
    "isGuestOwner",
    "data.owner in auth.ref('$user.linkedGuestUsers.id')",
    "isPremium",
    "auth.ref('$user.profile.plan').exists(p, p in ['basic', 'plus', 'pro'])",
];

const commonBind = [
    "isAuthenticated",
    "auth.id != null",
    "isCreator",
    "auth.id != null && auth.id == data.creatorId",
    "isStillCreator",
    "auth.id != null && auth.id == newData.creatorId",
    "isOwner",
    "auth.id != null && auth.id == data.id",
    "isStillOwner",
    "auth.id != null && auth.id == newData.id",
    "isPremium",
    "auth.ref('$user.profile.plan').exists(p, p in ['basic', 'plus', 'pro'])",
];

const rules = {
    // -----------------------------
    //      Admin Tables
    // -----------------------------
    $files: {
        allow: {
            view: "isAuthenticated",
            create: "isAuthenticated",
            update: "isAuthenticated",
            delete: "isAuthenticated",
        },
        bind: commonBind,
    },
    $users: {
        allow: {
            view: "isOwner",
            create: "false",
            delete: "false",
            update: "false",
        },
        bind: adminBind,
    },
    userProfiles: {
        allow: {
            view: "isOwner",
            create: "isAuthenticated",
            update: "isOwner",
            delete: "isOwner",
        },
        bind: adminBind,
    },
    // ----------------------
    //      Data Tables
    // ----------------------
    dnd5e_magicItems: {
        allow: {
            view: "true", // False means the admin SDK can still access
            create: "false",
            update: "false",
            delete: "false",
        },
    },
    dnd5e_spells: {
        allow: {
            view: "true",
            create: "false",
            update: "false",
            delete: "false",
        },
    },
    dnd5e_bestiary: {
        allow: {
            view: "true",
            create: "false",
            update: "false",
            delete: "false",
        },
    },
    // ----------------------
    //      User Tables
    // ----------------------
    settings: {
        allow: {
            view: "isOwner || isGuestOwner",
            create: "isAuthenticated && (size(data.ref('owner.settings.id')) < 1 || isPremium)",
            update: "isOwner || isGuestOwner",
            delete: "isOwner || isGuestOwner",
        },
        bind: dataBind,
    },
    parties: {
        allow: {
            view: "isOwner || isGuestOwner",
            create: "isAuthenticated && (size(data.ref('owner.parties.id')) < 1 || isPremium)",
            update: "isOwner || isGuestOwner",
            delete: "isOwner || isGuestOwner",
        },
        bind: dataBind,
    },
    settlements: {
        allow: {
            view: "isOwner || isGuestOwner",
            create: "isAuthenticated && (size(data.ref('owner.settlements.id')) < 1 || isPremium)",
            update: "isOwner || isGuestOwner",
            delete: "isOwner || isGuestOwner",
        },
        bind: dataBind,
    },
    // ----------------------
    //    Generator Tables
    // ----------------------
    battleMaps: {
        allow: {
            view: "isOwner || isGuestOwner",
            create: "isAuthenticated && (size(data.ref('owner.battleMaps.id')) < 1 || isPremium)",
            update: "isOwner || isGuestOwner",
            delete: "isOwner || isGuestOwner",
        },
        bind: dataBind,
    },
    encounters: {
        allow: {
            view: "isOwner || isGuestOwner",
            create: "isAuthenticated && (size(data.ref('owner.encounters.id')) < 1 || isPremium)",
            update: "isOwner || isGuestOwner",
            delete: "isOwner || isGuestOwner",
        },
        bind: dataBind,
    },
    spellbooks: {
        allow: {
            view: "isOwner || isGuestOwner",
            create: "isAuthenticated && (size(data.ref('owner.spellbooks.id')) < 1 || isPremium)",
            update: "isOwner || isGuestOwner",
            delete: "isOwner || isGuestOwner",
        },
        bind: dataBind,
    },
    magicShops: {
        allow: {
            view: "isOwner || isGuestOwner",
            create: "isAuthenticated && (size(data.ref('owner.magicShops.id')) < 1 || isPremium)",
            update: "isOwner || isGuestOwner",
            delete: "isOwner || isGuestOwner",
        },
        bind: dataBind,
    },
    worlds: {
        allow: {
            view: "isOwner || isGuestOwner",
            create: "isAuthenticated && (size(data.ref('owner.worlds.id')) < 1 || isPremium)",
            update: "isOwner || isGuestOwner",
            delete: "isOwner || isGuestOwner",
        },
        bind: dataBind,
    },
    starSystems: {
        allow: {
            view: "isOwner || isGuestOwner",
            create: "isAuthenticated && (size(data.ref('owner.starSystems.id')) < 1 || isPremium)",
            update: "isOwner || isGuestOwner",
            delete: "isOwner || isGuestOwner",
        },
        bind: dataBind,
    },
    galaxies: {
        allow: {
            view: "isOwner || isGuestOwner",
            create: "isAuthenticated && (size(data.ref('owner.galaxies.id')) < 1 || isPremium)",
            update: "isOwner || isGuestOwner",
            delete: "isOwner || isGuestOwner",
        },
        bind: dataBind,
    },
} satisfies InstantRules;

export default rules;
