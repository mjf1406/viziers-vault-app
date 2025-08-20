/** @format */
"use client";

import { useEffect, useState } from "react";
import { id, i, init, InstaQLEntity } from "@instantdb/react";

const schema = i.schema({
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

type Todo = InstaQLEntity<typeof schema, "todos">;

export default function App() {
    const [db, setDb] = useState<any>(null);
    const [room, setRoom] = useState<any>(null);

    useEffect(() => {
        const APP_ID = process.env.NEXT_PUBLIC_INSTANTDB_APP_ID;
        if (!APP_ID) {
            throw new Error(
                "Missing NEXT_PUBLIC_INSTANTDB_APP_ID. Did you set it in Vercel env vars?"
            );
        }
        console.log("APP_ID:", APP_ID);

        const dbInstance = init({ appId: APP_ID, schema });
        setDb(dbInstance);
        setRoom(dbInstance.room("todos"));
    }, []);

    if (!db || !room) {
        return <div>Loading...</div>;
    }

    // Queries and presence hooks must run *after* db is ready
    const { isLoading, error, data } = db.useQuery({ todos: {} });
    const { peers } = db.rooms.usePresence(room);
    const numUsers = 1 + Object.keys(peers).length;

    if (isLoading) return null;
    if (error)
        return <div className="text-red-500 p-4">Error: {error.message}</div>;

    const { todos } = data;

    return (
        <div className="font-mono min-h-screen flex justify-center items-center flex-col space-y-4">
            <div className="text-xs text-gray-500">
                Number of users online: {numUsers}
            </div>
            <h2 className="tracking-wide text-5xl text-gray-300">todos</h2>
            <div className="border border-gray-300 max-w-xs w-full">
                <TodoForm
                    todos={todos}
                    db={db}
                />
                <TodoList
                    todos={todos}
                    db={db}
                />
                <ActionBar
                    todos={todos}
                    db={db}
                />
            </div>
            <div className="text-xs text-center">
                Open another tab to see todos update in realtime!
            </div>
        </div>
    );
}

// --- Write helpers now take db as arg ---
function addTodo(db: any, text: string) {
    db.transact(
        db.tx.todos[id()].update({
            text,
            done: false,
            createdAt: Date.now(),
        })
    );
}

function deleteTodo(db: any, todo: Todo) {
    db.transact(db.tx.todos[todo.id].delete());
}

function toggleDone(db: any, todo: Todo) {
    db.transact(db.tx.todos[todo.id].update({ done: !todo.done }));
}

function deleteCompleted(db: any, todos: Todo[]) {
    const completed = todos.filter((todo) => todo.done);
    const txs = completed.map((todo) => db.tx.todos[todo.id].delete());
    db.transact(txs);
}

function toggleAll(db: any, todos: Todo[]) {
    const newVal = !todos.every((todo) => todo.done);
    db.transact(
        todos.map((todo) => db.tx.todos[todo.id].update({ done: newVal }))
    );
}

// --- Components ---
function ChevronDownIcon() {
    return (
        <svg viewBox="0 0 20 20">
            <path
                d="M5 8 L10 13 L15 8"
                stroke="currentColor"
                fill="none"
                strokeWidth="2"
            />
        </svg>
    );
}

function TodoForm({ todos, db }: { todos: Todo[]; db: any }) {
    return (
        <div className="flex items-center h-10 border-b border-gray-300">
            <button
                className="h-full px-2 border-r border-gray-300 flex items-center justify-center"
                onClick={() => toggleAll(db, todos)}
            >
                <div className="w-5 h-5">
                    <ChevronDownIcon />
                </div>
            </button>
            <form
                className="flex-1 h-full"
                onSubmit={(e) => {
                    e.preventDefault();
                    const input = e.currentTarget.input as HTMLInputElement;
                    addTodo(db, input.value);
                    input.value = "";
                }}
            >
                <input
                    className="w-full h-full px-2 outline-none bg-transparent"
                    autoFocus
                    placeholder="What needs to be done?"
                    type="text"
                    name="input"
                />
            </form>
        </div>
    );
}

function TodoList({ todos, db }: { todos: Todo[]; db: any }) {
    return (
        <div className="divide-y divide-gray-300">
            {todos.map((todo) => (
                <div
                    key={todo.id}
                    className="flex items-center h-10"
                >
                    <div className="h-full px-2 flex items-center justify-center">
                        <div className="w-5 h-5 flex items-center justify-center">
                            <input
                                type="checkbox"
                                className="cursor-pointer"
                                checked={todo.done}
                                onChange={() => toggleDone(db, todo)}
                            />
                        </div>
                    </div>
                    <div className="flex-1 px-2 overflow-hidden flex items-center">
                        {todo.done ? (
                            <span className="line-through">{todo.text}</span>
                        ) : (
                            <span>{todo.text}</span>
                        )}
                    </div>
                    <button
                        className="h-full px-2 flex items-center justify-center text-gray-300 hover:text-gray-500"
                        onClick={() => deleteTodo(db, todo)}
                    >
                        X
                    </button>
                </div>
            ))}
        </div>
    );
}

function ActionBar({ todos, db }: { todos: Todo[]; db: any }) {
    return (
        <div className="flex justify-between items-center h-10 px-2 text-xs border-t border-gray-300">
            <div>
                Remaining todos: {todos.filter((todo) => !todo.done).length}
            </div>
            <button
                className=" text-gray-300 hover:text-gray-500"
                onClick={() => deleteCompleted(db, todos)}
            >
                Delete Completed
            </button>
        </div>
    );
}
