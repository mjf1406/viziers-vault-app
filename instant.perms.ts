/** @format */

// Docs: https://www.instantdb.com/docs/permissions

// instant.perms.ts

import type { InstantRules } from "@instantdb/react";

const commonBind = [
    "isAuthenticated",
    "auth.id != null",
    "isOwner",
    "auth.id != null && auth.id == data.creatorId",
    "isStillOwner",
    "auth.id != null && auth.id == newData.creatorId",
];

const rules = {
    $files: {
        allow: {
            view: "isAuthenticated",
            create: "isAuthenticated",
            update: "isOwner && isStillOwner",
            delete: "isOwner",
        },
        bind: commonBind,
    },
    $users: {
        allow: {
            view: "auth.id == data.id",
            create: "false",
            delete: "false",
            update: "false",
        },
    },

    todos: {
        allow: {
            view: "isAuthenticated",
            create: "isAuthenticated",
            update: "isOwner && isStillOwner",
            delete: "isOwner",
        },
        bind: commonBind,
    },
    settings: {
        allow: {
            view: "isAuthenticated",
            create: "isAuthenticated",
            update: "isOwner && isStillOwner",
            delete: "isOwner",
        },
        bind: commonBind,
    },
    userProfiles: {
        allow: {
            view: "isAuthenticated",
            create: "isAuthenticated",
            update: "isOwner && isStillOwner",
            delete: "isOwner",
        },
        bind: commonBind,
    },

    // -----------------------------
    // System data tables
    // -----------------------------
    dnd5e_magicItems: {
        allow: {
            view: "true",
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
            view: "isOwner",
            create: "isAuthenticated",
            update: "isOwner && isStillOwner",
            delete: "isOwner",
        },
        bind: commonBind,
    },
    parties: {
        allow: {
            view: "isOwner",
            create: "isAuthenticated",
            update: "isOwner && isStillOwner",
            delete: "isOwner",
        },
        bind: commonBind,
    },
    encounters: {
        allow: {
            view: "isOwner",
            create: "isAuthenticated",
            update: "isOwner && isStillOwner",
            delete: "isOwner",
        },
        bind: commonBind,
    },
    spellbooks: {
        allow: {
            view: "isOwner",
            create: "isAuthenticated",
            update: "isOwner && isStillOwner",
            delete: "isOwner",
        },
        bind: commonBind,
    },
    magicShops: {
        allow: {
            view: "isOwner",
            create: "isAuthenticated",
            update: "isOwner && isStillOwner",
            delete: "isOwner",
        },
        bind: commonBind,
    },
    worlds: {
        allow: {
            view: "isOwner",
            create: "isAuthenticated",
            update: "isOwner && isStillOwner",
            delete: "isOwner",
        },
        bind: commonBind,
    },
    starSystems: {
        allow: {
            view: "isOwner",
            create: "isAuthenticated",
            update: "isOwner && isStillOwner",
            delete: "isOwner",
        },
        bind: commonBind,
    },
    galaxies: {
        allow: {
            view: "isOwner",
            create: "isAuthenticated",
            update: "isOwner && isStillOwner",
            delete: "isOwner",
        },
        bind: commonBind,
    },
} satisfies InstantRules;

export default rules;
