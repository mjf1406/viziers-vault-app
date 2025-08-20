/** @format */

// instant.schema.ts
import { i } from "@instantdb/react";

const _schema = i.schema({
    entities: {
        todos: i.entity({
            text: i.string(),
            done: i.boolean(),
            createdAt: i.number(),
        }),
    },
    rooms: {
        todos: {
            presence: i.entity({}),
        },
    },
});

type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
