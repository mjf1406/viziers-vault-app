/** @format */

// Docs: https://www.instantdb.com/docs/permissions

// instant.perms.ts

import type { InstantRules } from "@instantdb/react";

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
        bind: commonBind,
    },
    userProfiles: {
        allow: {
            view: "isOwner",
            create: "false",
            update: "isOwner",
            delete: "isOwner",
        },
        bind: commonBind,
    },

    todos: {
        allow: {
            view: "isAuthenticated",
            create: "isAuthenticated && isPremium",
            update: "isOwner && isStillOwner && isPremium",
            delete: "isOwner",
        },
        bind: commonBind,
    },
    settings: {
        allow: {
            view: "isAuthenticated",
            create: "isAuthenticated && isPremium",
            update: "isOwner && isStillOwner && isPremium",
            delete: "isOwner",
        },
        bind: commonBind,
    },

    // -----------------------------
    // System data tables
    // -----------------------------
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

    // -----------------------------
    // Tables the user can create in
    // -----------------------------
    battleMaps: {
        allow: {
            view: "isCreator",
            create: "isAuthenticated && isPremium",
            update: "isCreator && isStillCreator",
            delete: "isCreator",
        },
        bind: commonBind,
    },
    parties: {
        allow: {
            view: "isCreator",
            create: "isAuthenticated && isPremium",
            update: "isCreator && isStillCreator",
            delete: "isCreator",
        },
        bind: commonBind,
    },
    encounters: {
        allow: {
            view: "isCreator",
            create: "isAuthenticated && isPremium",
            update: "isCreator && isStillCreator",
            delete: "isCreator",
        },
        bind: commonBind,
    },
    spellbooks: {
        allow: {
            view: "true",
            create: "isAuthenticated && isPremium",
            update: "isCreator && isStillCreator",
            delete: "isCreator",
        },
        bind: commonBind,
    },
    magicShops: {
        allow: {
            view: "isCreator",
            create: "isAuthenticated && isPremium",
            update: "isCreator && isStillCreator",
            delete: "isCreator",
        },
        bind: commonBind,
    },
    worlds: {
        allow: {
            view: "isCreator",
            create: "isAuthenticated && isPremium",
            update: "isCreator && isStillCreator",
            delete: "isCreator",
        },
        bind: commonBind,
    },
    settlements: {
        allow: {
            view: "isCreator",
            create: "isAuthenticated && isPremium",
            update: "isCreator && isStillCreator",
            delete: "isCreator",
        },
        bind: commonBind,
    },
    starSystems: {
        allow: {
            view: "isCreator",
            create: "isAuthenticated && isPremium",
            update: "isCreator && isStillCreator",
            delete: "isCreator",
        },
        bind: commonBind,
    },
    galaxies: {
        allow: {
            view: "isCreator",
            create: "isAuthenticated && isPremium",
            update: "isCreator && isStillCreator",
            delete: "isCreator",
        },
        bind: commonBind,
    },
} satisfies InstantRules;

export default rules;
