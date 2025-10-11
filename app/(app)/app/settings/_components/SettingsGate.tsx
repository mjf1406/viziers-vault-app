/** @format */

"use client";

import { useMemo } from "react";
import { useUser } from "@/hooks/useUser";
import UrlLinkSettings from "./UrlLinkSettings";
import SettingsUpsell from "./SettingsUpsell";

export default function SettingsGate() {
    const { plan, isLoading } = useUser();

    const shouldUpsell = useMemo(() => {
        if (isLoading) return false;
        // If no plan (not logged in) or on free tier, upsell
        const p = (plan ?? "free").toLowerCase();
        return !p || p === "free";
    }, [plan, isLoading]);

    if (isLoading) {
        return <div className="text-muted-foreground">Loading…</div>;
    }

    if (shouldUpsell) {
        return (
            <div className="w-full flex justify-center">
                <SettingsUpsell className="w-full" />
            </div>
        );
    }

    return <UrlLinkSettings />;
}
