/** @format */

"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { seedPreMadeWorlds } from "../_actions/seedWorlds";
import { Check } from "lucide-react";

type Props = {
    className?: string;
    onSeeded?: () => void;
};

export default function SeedDefaultsButton({ className, onSeeded }: Props) {
    const [loading, setLoading] = useState(false);
    const [wasSuccessful, setWasSuccessful] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, []);

    const handleClick = async () => {
        setLoading(true);
        try {
            const res = await seedPreMadeWorlds();
            onSeeded?.();
            setWasSuccessful(true);
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
            timerRef.current = setTimeout(() => setWasSuccessful(false), 1000);
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
            {loading ? (
                "Adding..."
            ) : wasSuccessful ? (
                <span className="inline-flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    Added
                </span>
            ) : (
                "Add pre-made worlds"
            )}
        </Button>
    );
}
