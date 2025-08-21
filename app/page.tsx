/** @format */
// app/page.tsx

import { ThemeToggle } from "@/components/theme/theme-toggle";
import TodosClient from "@/components/todos-client";

export default function Page() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <ThemeToggle />
            <TodosClient />
        </div>
    );
}
