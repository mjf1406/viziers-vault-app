/** @format */

import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Docs | Vizier's Vault",
    description: "Generate various things for D&D 5e",
};

export default function Layout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <body className="antialiased">
            <main className="w-full">{children}</main>
        </body>
    );
}
