/** @format */

import Link from "next/link";
import { Button } from "../ui/button";
import { IconBrandDiscord } from "@tabler/icons-react";

export function JoinTheDiscord() {
    return (
        <Button
            asChild
            variant="outline"
            className="w-full"
        >
            <Link
                href={process.env.DISCORD_LINK!}
                target="_blank"
                prefetch={false}
            >
                Join the Discord
            </Link>
        </Button>
    );
}

export function DiscordIcon() {
    return (
        <Button
            variant="ghost"
            asChild
            size="icon"
            className="hidden sm:flex"
        >
            <Link
                href={process.env.DISCORD_LINK!}
                rel="noopener noreferrer"
                target="_blank"
                prefetch={false}
            >
                <IconBrandDiscord />
            </Link>
        </Button>
    );
}

export function Discord() {
    return (
        <Link
            href={process.env.DISCORD_LINK!}
            target="_blank"
            prefetch={false}
        >
            Join the Discord
        </Link>
    );
}
