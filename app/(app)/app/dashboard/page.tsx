/** @format */

"use client";

import db from "@/lib/db";
import PublicLanding from "@/components/PublicLanding";
import UserDashboard from "./_components/UserDashboard";

export default function DashboardPage() {
    return (
        <div className="space-y-6 p-4 xl:p-10 min-h-dvh">
            <db.SignedIn>
                <UserDashboard />
            </db.SignedIn>
            <db.SignedOut>
                <PublicLanding />
            </db.SignedOut>
        </div>
    );
}
