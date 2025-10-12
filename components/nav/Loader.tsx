/** @format */

import { Loader2 } from "lucide-react";

interface LoaderProps {
    text?: string;
}

export function Loader({ text = "Loading..." }: LoaderProps) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
            <p className="text-lg font-medium text-muted-foreground">{text}</p>
        </div>
    );
}
