/** @format */

import type { Metadata } from "next";
import GoogleClientProvider from "@/components/auth/GoogleClientProvider";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
    title: "Auth",
    description: "Authentication pages",
};

export default function AuthLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <GoogleClientProvider>
            <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
            >
                <div className="min-h-dvh flex flex-col">
                    <main className="flex-1 flex items-center justify-center p-4">
                        {children}
                    </main>
                    <Toaster richColors />
                </div>
            </ThemeProvider>
        </GoogleClientProvider>
    );
}
