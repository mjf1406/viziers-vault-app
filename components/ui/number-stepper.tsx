/** @format */

"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Minus, Plus, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NumberStepperInputProps
    extends Omit<
        React.InputHTMLAttributes<HTMLInputElement>,
        "value" | "defaultValue" | "onChange" | "type"
    > {
    value?: number | null;
    defaultValue?: number;
    onValueChange?: (value: number | null) => void;
    step?: number; // base step when no modifiers
    min?: number;
    max?: number;
    inputClassName?: string;
}

export function NumberStepperInput({
    className,
    inputClassName,
    value,
    defaultValue,
    onValueChange,
    step = 1,
    min,
    max,
    disabled,
    id,
    name,
    placeholder,
    ...rest
}: NumberStepperInputProps) {
    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = React.useState<number | null>(
        value ?? defaultValue ?? null
    );

    React.useEffect(() => {
        if (isControlled) setInternalValue(value ?? null);
    }, [isControlled, value]);

    const clamp = React.useCallback(
        (next: number): number => {
            let v = next;
            if (typeof min === "number") v = Math.max(min, v);
            if (typeof max === "number") v = Math.min(max, v);
            return v;
        },
        [min, max]
    );

    const commit = React.useCallback(
        (next: number | null) => {
            if (!isControlled) setInternalValue(next);
            onValueChange?.(next);
        },
        [isControlled, onValueChange]
    );

    const computeStepFromEvent = (
        e: React.MouseEvent | React.KeyboardEvent
    ): number => {
        // Sum of chosen modifier increments; fallback to base step when none.
        let inc = 0;
        const hasCtrl =
            (e as React.MouseEvent).ctrlKey ||
            (e as React.KeyboardEvent).ctrlKey ||
            (e as React.MouseEvent).metaKey ||
            (e as React.KeyboardEvent).metaKey;
        const hasShift = e.shiftKey;
        const hasAlt =
            (e as React.MouseEvent).altKey || (e as React.KeyboardEvent).altKey;
        if (hasCtrl) inc += 5;
        if (hasShift) inc += 10;
        if (hasAlt) inc += 25;
        const modifierCount =
            (hasCtrl ? 1 : 0) + (hasShift ? 1 : 0) + (hasAlt ? 1 : 0);
        if (modifierCount >= 2) {
            // Round to nearest multiple of 10 for combos
            inc = Math.round(inc / 10) * 10;
        }
        return inc || step || 1;
    };

    const handleDecrement = (e: React.MouseEvent) => {
        e.preventDefault();
        const current = internalValue ?? 0;
        const s = computeStepFromEvent(e);
        commit(clamp(current - s));
    };

    const handleIncrement = (e: React.MouseEvent) => {
        e.preventDefault();
        const current = internalValue ?? 0;
        const s = computeStepFromEvent(e);
        commit(clamp(current + s));
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        if (raw === "") {
            commit(null);
            return;
        }
        const parsed = Number(raw);
        if (Number.isFinite(parsed)) {
            commit(clamp(parsed));
        }
    };

    const currentValue = internalValue ?? "";
    const makeTitle = (dir: "-" | "+") =>
        dir === "+"
            ? "Click +1, Ctrl+5, Shift+10, Alt+25 (combos add)"
            : "Click -1, Ctrl-5, Shift-10, Alt-25 (combos add)";

    return (
        <div className={cn("flex w-full items-center", className)}>
            <div className="inline-flex w-full">
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleDecrement}
                    disabled={disabled}
                    title={makeTitle("-")}
                    aria-label="Decrease"
                    className="rounded-r-none"
                >
                    <Minus className="h-4 w-4" />
                </Button>
                <Input
                    id={id}
                    name={name}
                    type="number"
                    inputMode="numeric"
                    className={cn(
                        "flex-1 rounded-none border-x-0",
                        inputClassName
                    )}
                    value={currentValue as any}
                    onChange={handleInputChange}
                    placeholder={placeholder}
                    disabled={disabled}
                    {...rest}
                />
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleIncrement}
                    disabled={disabled}
                    title={makeTitle("+")}
                    aria-label="Increase"
                    className="rounded-l-none"
                >
                    <Plus className="h-4 w-4" />
                </Button>
            </div>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Help: faster increments"
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
                        <ul className="list-disc pl-4">
                            <li>Click: ±1</li>
                            <li>Ctrl/Cmd: ±5</li>
                            <li>Shift: ±10</li>
                            <li>Alt: ±25</li>
                            <li>
                                Combos use multiples of 10 (e.g., Ctrl+Shift =
                                20, Shift+Alt = 40, Ctrl+Shift+Alt = 40)
                            </li>
                        </ul>
                    </div>
                </TooltipContent>
            </Tooltip>
        </div>
    );
}

export default NumberStepperInput;
