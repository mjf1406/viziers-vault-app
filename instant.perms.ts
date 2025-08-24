/** @format */

// Docs: https://www.instantdb.com/docs/permissions
// instant.perms.ts
import type { InstantRules } from "@instantdb/react";

const rules = {
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
            view: "auth.id != null",
            create: "isOwner",
            update: "isOwner && isStillOwner",
            delete: "isOwner",
        },
        bind: [
            "isOwner", // This line is defined by the below line
            "auth.id != null && auth.id == data.creatorId",
            "isStillOwner", // This line is defined by the below line
            "auth.id != null && auth.id == newData.creatorId",
        ],
    },
} satisfies InstantRules;

export default rules;
