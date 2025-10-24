/** @format */

"use client";

import * as React from "react";
import { HelpCircle, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import styles from "./NumberInputWithStepper.module.css";

export interface NumberInputWithStepperProps {
    value?: number | null;
    min?: number;
    max?: number;
    step?: number;
    /** Native input step; defaults to "any" to avoid browser step-mismatch */
    nativeStep?: number | "any";
    onChange?: (newVal: number | null) => void;
    className?: string;
    inputClassName?: string;
    tabIndex?: number;
    disabled?: boolean;
    inputRef?: React.Ref<HTMLInputElement>;
    placeholder?: string;
    modifierSteps?: {
        ctrlOrMeta?: number;
        shift?: number;
        alt?: number;
        ctrlShift?: number;
        ctrlAlt?: number;
        shiftAlt?: number;
        ctrlShiftAlt?: number;
        combine?: boolean;
    };
}

export function NumberInputWithStepper({
    value,
    min,
    max,
    step = 1,
    nativeStep = "any",
    onChange,
    className,
    inputClassName,
    tabIndex,
    inputRef,
    disabled = false,
    placeholder,
    modifierSteps,
}: NumberInputWithStepperProps) {
    const clamp = (v: number) => {
        const lower = typeof min === "number" ? min : -Infinity;
        const upper = typeof max === "number" ? max : Infinity;
        return Math.min(Math.max(v, lower), upper);
    };

    // Determine precision from step and any modifier steps to avoid float artifacts
    const maxPrecision = React.useMemo(() => {
        const parts: number[] = [];
        const add = (n?: number) =>
            typeof n === "number" && Number.isFinite(n) ? parts.push(n) : null;
        add(step);
        if (modifierSteps) {
            add(modifierSteps.ctrlOrMeta);
            add(modifierSteps.shift);
            add(modifierSteps.alt);
            add(modifierSteps.ctrlShift);
            add(modifierSteps.ctrlAlt);
            add(modifierSteps.shiftAlt);
            add(modifierSteps.ctrlShiftAlt);
        }
        const countDecimals = (n: number) => {
            const s = n.toString();
            if (!s.includes(".")) return 0;
            return (s.split(".")[1] || "").length;
        };
        return parts.reduce((acc, n) => Math.max(acc, countDecimals(n)), 0);
    }, [step, modifierSteps]);

    const roundToPrecision = (n: number): number => {
        if (!Number.isFinite(n)) return n;
        const p = Math.min(Math.max(maxPrecision, 0), 6);
        return p > 0 ? Number(n.toFixed(p)) : n;
    };

    const computeStepFromEvent = (
        e: React.MouseEvent<HTMLButtonElement>
    ): number => {
        const hasCtrl = e.ctrlKey || (e as any).metaKey;
        const hasShift = e.shiftKey;
        const hasAlt = e.altKey;
        if (modifierSteps) {
            // Prefer explicit combo values if provided
            if (
                hasCtrl &&
                hasShift &&
                hasAlt &&
                typeof modifierSteps.ctrlShiftAlt === "number"
            ) {
                return modifierSteps.ctrlShiftAlt;
            }
            if (
                hasCtrl &&
                hasShift &&
                !hasAlt &&
                typeof modifierSteps.ctrlShift === "number"
            ) {
                return modifierSteps.ctrlShift;
            }
            if (
                hasCtrl &&
                hasAlt &&
                !hasShift &&
                typeof modifierSteps.ctrlAlt === "number"
            ) {
                return modifierSteps.ctrlAlt;
            }
            if (
                hasShift &&
                hasAlt &&
                !hasCtrl &&
                typeof modifierSteps.shiftAlt === "number"
            ) {
                return modifierSteps.shiftAlt;
            }
            const candidates: number[] = [];
            if (hasCtrl && typeof modifierSteps.ctrlOrMeta === "number")
                candidates.push(modifierSteps.ctrlOrMeta);
            if (hasShift && typeof modifierSteps.shift === "number")
                candidates.push(modifierSteps.shift);
            if (hasAlt && typeof modifierSteps.alt === "number")
                candidates.push(modifierSteps.alt);
            if (candidates.length) {
                return modifierSteps.combine
                    ? candidates.reduce((a, b) => a + b, 0)
                    : Math.max(...candidates);
            }
            return step || 1;
        }
        // Defaults: Click ±1, Ctrl/Cmd ±5, Shift ±10, Alt ±25. Combos add.
        let inc = 0;
        if (hasCtrl) inc += 5;
        if (hasShift) inc += 10;
        if (hasAlt) inc += 25;
        return inc || step || 1;
    };

    const handleStep = (
        deltaSign: -1 | 1,
        e: React.MouseEvent<HTMLButtonElement>
    ) => {
        if (disabled) return;
        const current = typeof value === "number" ? value : 0;
        const inc = computeStepFromEvent(e);
        const raw = current + deltaSign * inc;
        const next = clamp(roundToPrecision(raw));
        onChange?.(next);
    };

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (disabled) return;
        const raw = e.target.value;
        if (raw === "") {
            onChange?.(null);
            return;
        }
        let v = parseFloat(raw);
        if (!Number.isFinite(v)) return;
        onChange?.(clamp(roundToPrecision(v)));
    };

    return (
        <div
            className={`inline-flex items-center ${styles.noSpin} ${
                className ?? ""
            }`}
        >
            <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={(e) => handleStep(-1, e)}
                tabIndex={-1}
                aria-label="decrement"
                className="rounded-l-md rounded-r-none border-r-0"
                disabled={disabled}
            >
                <Minus className="h-4 w-4" />
            </Button>

            <Input
                type="number"
                value={(value ?? "") as any}
                min={min}
                max={max}
                step={nativeStep}
                onChange={handleInput}
                ref={inputRef}
                tabIndex={tabIndex}
                placeholder={placeholder}
                disabled={disabled}
                className={`h-9 rounded-none border-r-0 border-l-0 p-1 text-center ${
                    inputClassName ?? "w-16"
                }`}
            />

            <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={(e) => handleStep(1, e)}
                tabIndex={-1}
                aria-label="increment"
                className="rounded-l-none rounded-r-md border-l-0"
                disabled={disabled}
            >
                <Plus className="h-4 w-4" />
            </Button>

            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Help: modifier key steps"
                        className="ml-2"
                    >
                        <HelpCircle className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent sideOffset={6}>
                    <div className="space-y-1">
                        <div className="font-medium">
                            Speed up with modifier keys
                        </div>
                        <ul className="list-disc pl-4 text-sm">
                            {modifierSteps ? (
                                <>
                                    <li>
                                        Click: ±
                                        {Number.isInteger(step || 1)
                                            ? step || 1
                                            : step || 1}
                                    </li>
                                    {typeof modifierSteps.ctrlOrMeta ===
                                        "number" && (
                                        <li>
                                            Ctrl: ±{modifierSteps.ctrlOrMeta}
                                        </li>
                                    )}
                                    {typeof modifierSteps.shift ===
                                        "number" && (
                                        <li>Shift: ±{modifierSteps.shift}</li>
                                    )}
                                    {typeof modifierSteps.alt === "number" && (
                                        <li>Alt: ±{modifierSteps.alt}</li>
                                    )}
                                    {typeof modifierSteps.ctrlShift ===
                                        "number" && (
                                        <li>
                                            Ctrl+Shift: ±
                                            {modifierSteps.ctrlShift}
                                        </li>
                                    )}
                                    {typeof modifierSteps.ctrlAlt ===
                                        "number" && (
                                        <li>
                                            Ctrl+Alt: ±{modifierSteps.ctrlAlt}
                                        </li>
                                    )}
                                    {typeof modifierSteps.shiftAlt ===
                                        "number" && (
                                        <li>
                                            Shift+Alt: ±{modifierSteps.shiftAlt}
                                        </li>
                                    )}
                                    {typeof modifierSteps.ctrlShiftAlt ===
                                        "number" && (
                                        <li>
                                            Ctrl+Shift+Alt: ±
                                            {modifierSteps.ctrlShiftAlt}
                                        </li>
                                    )}
                                </>
                            ) : (
                                <>
                                    <li>Click: ±1</li>
                                    <li>Ctrl: ±5</li>
                                    <li>Shift: ±10</li>
                                    <li>Alt: ±25</li>
                                </>
                            )}
                        </ul>
                    </div>
                </TooltipContent>
            </Tooltip>
        </div>
    );
}
