/** @format */

"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";

export type CopyLinkButtonProps = Omit<
    React.ComponentProps<typeof Button>,
    "onClick" | "children"
> & {
    url?: string;
    label?: string;
    labelCopied?: string;
    labelSrOnly?: boolean;
    copyDurationMs?: number;
};

export default function CopyLinkButton(props: CopyLinkButtonProps) {
    const {
        url,
        label = "Copy URL",
        labelCopied = "Copied!",
        labelSrOnly = false,
        copyDurationMs = 2000,
        title,
        ...buttonProps
    } = props;

    const [copied, setCopied] = React.useState(false);
    const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    React.useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, []);

    const onClick = React.useCallback(async () => {
        const href =
            url || (typeof window !== "undefined" ? window.location.href : "");
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(href);
            } else {
                const ta = document.createElement("textarea");
                ta.value = href;
                ta.setAttribute("readonly", "");
                ta.style.position = "absolute";
                ta.style.left = "-9999px";
                document.body.appendChild(ta);
                ta.select();
                document.execCommand("copy");
                document.body.removeChild(ta);
            }
            setCopied(true);
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => {
                setCopied(false);
                timerRef.current = null;
            }, copyDurationMs);
        } catch (e) {
            // no-op: copying failed
        }
    }, [url, copyDurationMs]);

    return (
        <Button
            onClick={onClick}
            aria-label={label}
            title={title ?? label}
            {...buttonProps}
        >
            <Copy className="h-4 w-4" />
            {labelSrOnly ? (
                <span className="sr-only">{copied ? labelCopied : label}</span>
            ) : (
                <span className="ml-2">{copied ? labelCopied : label}</span>
            )}
        </Button>
    );
}
