/** @format */

"use client";

import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { SHOP_TYPES, type ShopType } from "@/lib/constants/settlements";
import {
    FaShirt,
    FaBoxOpen,
    FaSkullCrossbones,
    FaFlask,
    FaWandMagicSparkles,
    FaScroll,
    FaHammer,
} from "react-icons/fa6";

const ICONS: Record<ShopType, React.ReactNode> = {
    armor: <FaShirt />,
    items: <FaBoxOpen />,
    poisons: <FaSkullCrossbones />,
    potions: <FaFlask />,
    "spell components": <FaWandMagicSparkles />,
    scrolls: <FaScroll />,
    weapons: <FaHammer />,
};

// Renamed and converted to checkboxes: multiple selectable, uses secondary color
export default function StockTypesCheckboxes({
    values,
    onChange,
}: {
    values: ShopType[];
    onChange: (next: ShopType[]) => void;
}) {
    const toggle = (opt: ShopType) => {
        if (values.includes(opt)) {
            onChange(values.filter((v) => v !== opt));
        } else {
            onChange([...values, opt]);
        }
    };

    return (
        <div className="flex gap-1">
            {SHOP_TYPES.map((opt) => {
                const selected = values.includes(opt);
                return (
                    <Tooltip key={opt}>
                        <TooltipTrigger asChild>
                            <button
                                type="button"
                                onClick={() => toggle(opt)}
                                className={
                                    "h-8 min-w-8 px-2 inline-flex items-center justify-center rounded-md border text-xs " +
                                    (selected
                                        ? "bg-secondary text-secondary-foreground border-secondary"
                                        : "bg-background")
                                }
                                aria-pressed={selected}
                            >
                                <Checkbox
                                    className="sr-only"
                                    checked={selected}
                                    disabled
                                />
                                {ICONS[opt as ShopType]}
                            </button>
                        </TooltipTrigger>
                        <TooltipContent className="capitalize">
                            {opt}
                        </TooltipContent>
                    </Tooltip>
                );
            })}
        </div>
    );
}
