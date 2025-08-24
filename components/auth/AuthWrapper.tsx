/** @format */

"use client";

import db from "@/lib/db";
import PublicLanding from "@/components/PublicLanding";

interface AuthWrapperProps {
    children: React.ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
    return (
        <>
            <db.SignedIn>{children}</db.SignedIn>
            <db.SignedOut>
                <PublicLanding />
            </db.SignedOut>
        </>
    );
}
