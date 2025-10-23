/** @format */

"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { seedPreMadeWorlds } from "../_actions/seedWorlds";

type Props = {
    className?: string;
    onSeeded?: () => void;
};

export default function SeedDefaultsButton({ className, onSeeded }: Props) {
    const [loading, setLoading] = useState(false);

    const handleClick = async () => {
        setLoading(true);
        try {
            const res = await seedPreMadeWorlds();
            if ((res as any)?.alreadySeeded) {
                toast.success("Pre-made worlds already added");
            } else {
                toast.success("Pre-made worlds added to your account");
            }
            onSeeded?.();
        } catch (e: any) {
            toast.error(e?.message || "Failed to add pre-made worlds");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            type="button"
            variant="outline"
            className={className}
            onClick={handleClick}
            disabled={loading}
        >
            {loading ? "Adding..." : "Add pre-made worlds"}
        </Button>
    );
}
