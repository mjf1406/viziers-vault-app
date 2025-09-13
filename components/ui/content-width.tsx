/** @format */

"use client";

import React from "react";

type ContentWidthSetting = "narrow" | "default" | "wide";

function getMaxWidthCh(setting: ContentWidthSetting): number {
    switch (setting) {
        case "narrow":
            return 55;
        case "wide":
            return 75;
        default:
            return 65;
    }
}

export function ContentWidth({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    const [setting, setSetting] =
        React.useState<ContentWidthSetting>("default");

    React.useEffect(() => {
        try {
            const stored = localStorage.getItem("contentWidthSetting");
            if (
                stored === "narrow" ||
                stored === "default" ||
                stored === "wide"
            ) {
                setSetting(stored);
            }
        } catch {}
    }, []);

    const maxWidth = `${getMaxWidthCh(setting)}ch`;

    return (
        <div
            className={className}
            style={{ maxWidth, width: "100%" }}
        >
            {children}
        </div>
    );
}

export function setContentWidth(setting: ContentWidthSetting) {
    if (typeof window === "undefined") return;
    localStorage.setItem("contentWidthSetting", setting);
}
