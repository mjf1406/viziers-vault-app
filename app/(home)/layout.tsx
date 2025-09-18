/** @format */

import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Navbar } from "./_components/layout/navbar";

export const metadata: Metadata = {
    title: "Blog | Vizier's Vault",
    description: "Generate various things for D&D 5e",
};

const inter = Inter({ subsets: ["latin"] });

export default function Layout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div
            className={cn("min-h-screen bg-background w-full", inter.className)}
        >
            <Navbar />
            <div
                vaul-drawer-wrapper=""
                className="bg-background"
            >
                {children}
            </div>
        </div>
    );
}
