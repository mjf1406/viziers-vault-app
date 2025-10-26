/** @format */

"use client";

import { useMemo } from "react";
import { useUser } from "@/hooks/useUser";
import UrlLinkSettings from "./_components/UrlLinkSettings";
import SettingsUpsell from "./_components/SettingsUpsell";
import MagicShopSettings from "./_components/MagicShopSettings";
import SpellbookSettings from "./_components/SpellbookSettings";

export default function SettingsPage() {
    const { plan, isLoading } = useUser();
    const shouldUpsell = useMemo(() => {
        if (isLoading) return false;
        const p = (plan ?? "free").toLowerCase();
        return !p || p === "free";
    }, [plan, isLoading]);

    if (isLoading) {
        return (
            <div className="w-full h-full space-y-6 p-6 text-left">
                <div className="text-4xl font-bold">Settings</div>
                <div className="text-muted-foreground">Loading…</div>
            </div>
        );
    }

    return (
        <div className="w-full h-full space-y-6 p-6 text-left">
            <div className="text-4xl font-bold">Settings</div>
            <div className="grid gap-6">
                {shouldUpsell ? (
                    <div className="w-full flex justify-center">
                        <SettingsUpsell className="w-full" />
                    </div>
                ) : (
                    <>
                        <MagicShopSettings />
                        <SpellbookSettings />
                        <UrlLinkSettings />
                    </>
                )}
            </div>
        </div>
    );
}
