/** @format */

"use client";

import db from "@/lib/db";
import PublicLanding from "@/components/PublicLanding";
import UserDashboard from "./components/UserDashboard";

export default function DashboardPage() {
    return (
        <div className="w-full h-full text-center space-y-5 p-6 min-h-dvh">
            <db.SignedIn>
                <UserDashboard />
            </db.SignedIn>
            <db.SignedOut>
                <PublicLanding />
            </db.SignedOut>
        </div>
    );
}
