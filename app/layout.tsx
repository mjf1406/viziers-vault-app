/** @format */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/nav/Footer";
import GoogleClientProvider from "@/components/auth/GoogleClientProvider";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "App | Vizier's Vault",
    description: "Generate various things for D&D 5e",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang="en"
            suppressHydrationWarning
        >
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased`}
            >
                <GoogleClientProvider>
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="system"
                        enableSystem
                        disableTransitionOnChange
                    >
                        <Header />
                        <div className="min-h-screen">{children}</div>
                        <Toaster richColors />
                        <Footer />
                    </ThemeProvider>
                </GoogleClientProvider>
                ;
            </body>
        </html>
    );
}
