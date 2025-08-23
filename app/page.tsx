/** @format */
// app/page.tsx

import { ThemeToggle } from "@/components/theme/theme-toggle";
import TodosClient from "@/components/todos-client";

export default function Page() {
    return (
        <div className="flex items-center p-5 justify-center">
            <ThemeToggle />
            <TodosClient />
        </div>
    );
}
