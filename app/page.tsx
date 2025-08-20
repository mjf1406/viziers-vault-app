/** @format */
// app/page.tsx

import TodosClient from "@/components/todos-client";

export default function Page() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <TodosClient />
        </div>
    );
}
