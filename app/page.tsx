/** @format */
// app/page.tsx

import AuthWrapper from "@/components/auth/AuthWrapper";
import UserDashboard from "@/components/auth/UserDashboard";
import PublicLanding from "@/components/PublicLanding";

export default function Page() {
    return (
        <AuthWrapper>
            <UserDashboard />
        </AuthWrapper>
    );
}
