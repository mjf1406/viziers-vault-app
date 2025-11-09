/** @format */

"use client";

import React from "react";
import { useParams } from "next/navigation";
import db from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CopyLinkButton from "@/components/CopyLinkButton";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";
import { Swords, ExternalLink, Users } from "lucide-react";
import { mapBiomeToHabitat } from "@/app/(app)/app/encounter-generator/_constants/encounters";
import { calculatePartyStats } from "@/app/(app)/app/encounter-generator/_utils/combat-encounter-generation";

export default function EncounterDetailPage() {
    const params = useParams();
    const encounterId = (params?.encounterId as string) ?? "";

    const { isLoading, error, data } = db.useQuery({
        encounters: { $: { where: { id: encounterId }, limit: 1 } },
    });

    if (isLoading) return <div className="p-4 xl:p-10">Loading…</div>;
    if (error)
        return (
            <div className="p-4 xl:p-10 text-destructive">Failed to load</div>
        );

    const encounter = Array.isArray(data?.encounters)
        ? data?.encounters[0]
        : null;

    if (!encounter) {
        return (
            <div className="p-4 xl:p-10">
                <div className="mt-6">Encounter not found.</div>
            </div>
        );
    }

    const encounters = Array.isArray(encounter?.encounters)
        ? encounter.encounters
        : [];
    const options = (encounter?.options ?? {}) as any;
    const instances = Array.isArray(options?.instances)
        ? options.instances
        : [options];
    const party = options?.party ?? null;
    const partyStats = calculatePartyStats(party);

    const renderCombatEncounter = (enc: any, index: number) => {
        const monsters = Array.isArray(enc?.monsters) ? enc.monsters : [];
        return (
            <Card key={index}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Swords className="w-5 h-5" />
                        Combat Encounter {index + 1}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                        {enc.difficulty && (
                            <Badge variant="secondary" className="text-xs">
                                Difficulty: {String(enc.difficulty).charAt(0).toUpperCase() + String(enc.difficulty).slice(1)}
                            </Badge>
                        )}
                        {typeof enc.distance === "number" && (
                            <Badge variant="secondary" className="text-xs">
                                Distance: {enc.distance.toLocaleString()} ft
                            </Badge>
                        )}
                        {typeof enc.numberOfCreatures === "number" && (
                            <Badge variant="secondary" className="text-xs">
                                Creatures: {enc.numberOfCreatures}
                            </Badge>
                        )}
                        {typeof enc.totalXP === "number" && (
                            <Badge variant="secondary" className="text-xs">
                                Total XP: {enc.totalXP.toLocaleString()}
                            </Badge>
                        )}
                        {typeof enc.adjustedXP === "number" && (
                            <Badge variant="secondary" className="text-xs">
                                Adjusted XP: {enc.adjustedXP.toLocaleString()}
                            </Badge>
                        )}
                        {typeof enc.xpPerPC === "number" && (
                            <Badge variant="secondary" className="text-xs">
                                XP per PC: {enc.xpPerPC.toLocaleString()}
                            </Badge>
                        )}
                    </div>

                    {typeof enc.xpLowerBound === "number" &&
                        typeof enc.xpUpperBound === "number" && (
                            <div className="text-sm text-muted-foreground">
                                XP Bounds: {enc.xpLowerBound.toLocaleString()} - {enc.xpUpperBound.toLocaleString()}
                            </div>
                        )}

                    {monsters.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="font-medium text-sm">Monsters:</h4>
                            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                                {monsters.map((monster: any, mIndex: number) => (
                                    <div
                                        key={mIndex}
                                        className="border rounded p-3"
                                    >
                                        <div className="font-medium">
                                            {monster.name || "Unknown Monster"}
                                        </div>
                                        <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                                            <Badge
                                                variant="outline"
                                                className="text-[10px] py-0 px-1"
                                            >
                                                CR: {monster.crText ?? monster.cr ?? "—"}
                                            </Badge>
                                            {typeof monster.quantity === "number" && (
                                                <span>Qty: {monster.quantity}</span>
                                            )}
                                            {monster.label && (
                                                <Badge
                                                    variant="outline"
                                                    className="text-[10px] py-0 px-1"
                                                >
                                                    {monster.label}
                                                </Badge>
                                            )}
                                        </div>
                                        {monster.url && (
                                            <a
                                                href={monster.url}
                                                target="_blank"
                                                rel="noreferrer noopener"
                                                className="text-xs text-primary hover:underline flex items-center gap-1 mt-2"
                                            >
                                                Open reference
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    };

    const renderNonCombatEncounter = (enc: any, index: number) => {
        return (
            <Card key={index}>
                <CardHeader>
                    <CardTitle>Non-Combat Encounter {index + 1}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {typeof enc.distance === "number" && (
                        <Badge variant="secondary" className="text-xs">
                            Distance: {enc.distance.toLocaleString()} ft
                        </Badge>
                    )}
                    <div className="text-sm whitespace-pre-wrap">
                        {enc.description || "No description available"}
                    </div>
                </CardContent>
            </Card>
        );
    };

    const renderHazardEncounter = (enc: any, index: number) => {
        return (
            <Card key={index}>
                <CardHeader>
                    <CardTitle>Hazard Encounter {index + 1}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                        {enc.difficulty && (
                            <Badge variant="secondary" className="text-xs">
                                Difficulty: {String(enc.difficulty).charAt(0).toUpperCase() + String(enc.difficulty).slice(1)}
                            </Badge>
                        )}
                        {typeof enc.distance === "number" && (
                            <Badge variant="secondary" className="text-xs">
                                Distance: {enc.distance.toLocaleString()} ft
                            </Badge>
                        )}
                    </div>
                    <div className="text-sm whitespace-pre-wrap">
                        {enc.description || "No description available"}
                    </div>
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="space-y-6 p-4 xl:p-10">
            <div className="space-y-2">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <Link
                                prefetch={true}
                                href="/app/encounter-generator"
                            >
                                Encounters
                            </Link>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <span className="text-foreground">
                                {encounter.name ?? "Encounter"}
                            </span>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold flex gap-3 items-center justify-center">
                        <Swords />
                        {encounter.name ?? "Encounter"}
                    </h1>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <div>
                    Created{" "}
                    {encounter.createdAt
                        ? new Date(encounter.createdAt as any).toLocaleString()
                        : "—"}
                </div>
                <div className="flex items-center gap-2">
                    <CopyLinkButton
                        variant="outline"
                        size="sm"
                    />
                </div>
            </div>

            {/* Party Info */}
            {party && party.pcs && party.pcs.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            {party.name ? party.name : "Party Information"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex flex-wrap gap-2">
                                <Badge variant="secondary" className="text-xs">
                                    Party Size: {partyStats.partySize}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                    Average Level: {partyStats.averageLevel.toFixed(1)}
                                </Badge>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-medium text-sm">Party Composition:</h4>
                                <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                                    {party.pcs.map((pc: any, idx: number) => (
                                        <div
                                            key={idx}
                                            className="border rounded p-2 text-sm"
                                        >
                                            <div className="font-medium">
                                                Level {pc.level}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {pc.quantity} {pc.quantity === 1 ? "PC" : "PCs"}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Options/Instances Info */}
            {instances.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {instances.map((instance: any, idx: number) => {
                        const biome = instance?.biome ?? null;
                        const habitat = mapBiomeToHabitat(biome);
                        const travelPace = instance?.travelPace ?? null;
                        const road = instance?.road ?? null;
                        const travelMedium = instance?.travelMedium ?? null;
                        const time = instance?.time ?? null;
                        const season = instance?.season ?? null;

                        return (
                            <div key={idx} className="flex flex-wrap gap-2">
                                {instances.length > 1 && (
                                    <Badge variant="secondary" className="text-xs">
                                        Instance {idx + 1}
                                    </Badge>
                                )}
                                {habitat && (
                                    <Badge
                                        variant="secondary"
                                        className="text-xs"
                                    >
                                        Biome: {habitat}
                                    </Badge>
                                )}
                                {travelPace && travelPace !== "random" && (
                                    <Badge
                                        variant="secondary"
                                        className="text-xs"
                                    >
                                        Pace: {travelPace}
                                    </Badge>
                                )}
                                {road && road !== "random" && (
                                    <Badge
                                        variant="secondary"
                                        className="text-xs"
                                    >
                                        Road: {road}
                                    </Badge>
                                )}
                                {travelMedium && travelMedium !== "random" && (
                                    <Badge
                                        variant="secondary"
                                        className="text-xs"
                                    >
                                        Medium: {travelMedium}
                                    </Badge>
                                )}
                                {time && time !== "random" && (
                                    <Badge
                                        variant="secondary"
                                        className="text-xs"
                                    >
                                        Time: {time}
                                    </Badge>
                                )}
                                {season && season !== "random" && (
                                    <Badge
                                        variant="secondary"
                                        className="text-xs"
                                    >
                                        Season: {season}
                                    </Badge>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Encounters List */}
            {encounters.length === 0 ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Encounters (0)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-muted-foreground">
                            No encounters generated
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    {encounters.map((enc: any, index: number) => {
                        if (enc.type === "combat") {
                            return renderCombatEncounter(enc, index);
                        } else if (enc.type === "non-combat") {
                            return renderNonCombatEncounter(enc, index);
                        } else if (enc.type === "hazard") {
                            return renderHazardEncounter(enc, index);
                        } else {
                            return (
                                <Card key={index}>
                                    <CardHeader>
                                        <CardTitle>Encounter {index + 1}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-sm text-muted-foreground">
                                            Unknown encounter type
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        }
                    })}
                </div>
            )}
        </div>
    );
}

