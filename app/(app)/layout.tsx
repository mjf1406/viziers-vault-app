/** @format */

import type { Metadata } from "next";
import { sectionTitleTemplate } from "@/lib/seo";
import GoogleClientProvider from "@/components/auth/GoogleClientProvider";
import { Toaster } from "@/components/ui/sonner";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/nav/app-sidebar";
import { SidebarHeader } from "@/components/nav/SidebarHeader";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { FooterSection } from "../(home)/_components/layout/sections/footer";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import SessionCookieSync from "./_components/SessionCookieSync";

export const metadata: Metadata = {
    title: sectionTitleTemplate("App"),
    description: "Generate various things for D&D 5e",
};

export default function AppLayout({
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
                <SidebarProvider>
                    <AppSidebar />
                    <SidebarInset>
                        <SidebarHeader />
                        <div>
                            <main className="w-full">
                                <NuqsAdapter>
                                    <SessionCookieSync />
                                    {children}
                                </NuqsAdapter>
                            </main>
                        </div>
                        <div className="relative">
                            <div
                                className="absolute left-0 top-0 bottom-0 border-l"
                                aria-hidden
                            />
                            <FooterSection />
                        </div>
                        <Toaster richColors />
                    </SidebarInset>
                </SidebarProvider>
            </ThemeProvider>
        </GoogleClientProvider>
    );
}
