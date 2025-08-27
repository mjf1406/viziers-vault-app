/** @format */

import type { Metadata } from "next";
import GoogleClientProvider from "@/components/auth/GoogleClientProvider";
import { Toaster } from "@/components/ui/sonner";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/nav/app-sidebar";
import { SidebarHeader } from "@/components/nav/SidebarHeader";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { FooterSection } from "../(home)/_components/layout/sections/footer";
import { Footer } from "@/components/nav/Footer";

export const metadata: Metadata = {
    title: "App | Vizier's Vault",
    description: "Generate various things for D&D 5e",
};

export default function AppLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <body className="antialiased">
            <GoogleClientProvider>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    <SidebarProvider>
                        <AppSidebar />
                        <div>
                            <SidebarHeader />
                            <main className="w-full">{children}</main>
                            <Toaster richColors />
                            <FooterSection />
                        </div>
                    </SidebarProvider>
                </ThemeProvider>
            </GoogleClientProvider>
        </body>
    );
}
