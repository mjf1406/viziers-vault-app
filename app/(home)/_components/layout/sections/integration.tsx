/** @format */

"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

type NodeId =
    | "galaxy"
    | "system"
    | "world"
    | "shop"
    | "battle"
    | "encounter"
    | "party";

// Update the Edge type to support bidirectional arrows
type Edge = {
    from: NodeId;
    to: NodeId;
    offset?: number;
    bidirectional?: boolean;
};

// Update the EDGES array - remove the separate shop->world edge and make world->shop bidirectional
const EDGES: Edge[] = [
    { from: "galaxy", to: "system" },
    { from: "system", to: "world" },
    { from: "world", to: "shop", bidirectional: true }, // Make this bidirectional
    // Remove: { from: "shop", to: "world", offset: -24 },
    { from: "world", to: "battle" },
    { from: "world", to: "encounter" },
    { from: "world", to: "party" },
    { from: "encounter", to: "party" },
];

const NODES: Record<NodeId, { title: string; description: string }> = {
    galaxy: {
        title: "Galaxy Generator",
        description: "Generate galaxies with multiple star systems.",
    },
    system: {
        title: "Star System Generator",
        description: "Create star systems with multiple worlds.",
    },
    world: {
        title: "World Generator",
        description: "Hex-based world exploration and content hooks.",
    },
    shop: {
        title: "Magic Shop Generator",
        description: "Inventory adapts to your world's settings.",
    },
    battle: {
        title: "Battle Map Generator",
        description: "Detailed, ready-to-play encounter maps.",
    },
    encounter: {
        title: "Encounter Generator",
        description: "Balanced encounters for your party.",
    },
    party: {
        title: "Party Management",
        description: "Manage composition, balance, and progress.",
    },
};

export function IntegrationSection() {
    // stable refs for each node (do not recreate on render)
    const galaxyRef = React.useRef<HTMLDivElement | null>(null);
    const systemRef = React.useRef<HTMLDivElement | null>(null);
    const worldRef = React.useRef<HTMLDivElement | null>(null);
    const shopRef = React.useRef<HTMLDivElement | null>(null);
    const battleRef = React.useRef<HTMLDivElement | null>(null);
    const encounterRef = React.useRef<HTMLDivElement | null>(null);
    const partyRef = React.useRef<HTMLDivElement | null>(null);

    // mapping that's stable
    const nodeRefs = React.useMemo(
        () => ({
            galaxy: galaxyRef,
            system: systemRef,
            world: worldRef,
            shop: shopRef,
            battle: battleRef,
            encounter: encounterRef,
            party: partyRef,
        }),
        []
    );

    const containerRef = React.useRef<HTMLDivElement | null>(null);
    const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

    // build adjacency for tooltips
    const connectsTo = React.useMemo(() => {
        const map: Record<NodeId, string[]> = {
            galaxy: [],
            system: [],
            world: [],
            shop: [],
            battle: [],
            encounter: [],
            party: [],
        };
        EDGES.forEach((e) => map[e.from].push(NODES[e.to].title));
        return map;
    }, []);

    // Drawing effect: runs once and installs observers/listeners that call draw()
    React.useEffect(() => {
        const container = containerRef.current;
        const canvas = canvasRef.current;
        if (!container || !canvas) return;

        const dpr =
            typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

        // helpers
        const getRelRect = (el: HTMLElement | null) => {
            if (!el) return null;
            const cRect = container.getBoundingClientRect();
            const r = el.getBoundingClientRect();
            return {
                x: r.left - cRect.left,
                y: r.top - cRect.top,
                width: r.width,
                height: r.height,
            };
        };

        const chooseSides = (
            a: { x: number; y: number; width: number; height: number } | null,
            b: { x: number; y: number; width: number; height: number } | null
        ) => {
            if (!a || !b)
                return {
                    from: "right" as const,
                    to: "left" as const,
                    mode: "h" as const,
                };
            const acx = a.x + a.width / 2;
            const acy = a.y + a.height / 2;
            const bcx = b.x + b.width / 2;
            const bcy = b.y + b.height / 2;
            const dx = bcx - acx;
            const dy = bcy - acy;
            if (Math.abs(dx) >= Math.abs(dy)) {
                return {
                    from: dx >= 0 ? ("right" as const) : ("left" as const),
                    to: dx >= 0 ? ("left" as const) : ("right" as const),
                    mode: "h" as const,
                };
            }
            return {
                from: dy >= 0 ? ("bottom" as const) : ("top" as const),
                to: dy >= 0 ? ("top" as const) : ("bottom" as const),
                mode: "v" as const,
            };
        };

        const anchorPoint = (
            r: { x: number; y: number; width: number; height: number },
            side: "left" | "right" | "top" | "bottom"
        ) => {
            const cx = r.x + r.width / 2;
            const cy = r.y + r.height / 2;
            switch (side) {
                case "left":
                    return { x: r.x, y: cy };
                case "right":
                    return { x: r.x + r.width, y: cy };
                case "top":
                    return { x: cx, y: r.y };
                case "bottom":
                    return { x: cx, y: r.y + r.height };
            }
        };

        const drawCustomWorldToShop = (
            ctx: CanvasRenderingContext2D,
            sx: number,
            sy: number,
            ex: number,
            ey: number,
            bidirectional = false
        ) => {
            // Custom control points for left-to-top connection
            const c1x = sx - 60; // extend left from world
            const c1y = sy;
            const c2x = ex;
            const c2y = ey - 60; // extend up from shop

            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.bezierCurveTo(c1x, c1y, c2x, c2y, ex, ey);
            ctx.stroke();

            const len = 10;

            // arrow at the end (use the second control point to get the tangent)
            const endAngle = Math.atan2(ey - c2y, ex - c2x);
            ctx.beginPath();
            ctx.moveTo(ex, ey);
            ctx.lineTo(
                ex - len * Math.cos(endAngle - Math.PI / 6),
                ey - len * Math.sin(endAngle - Math.PI / 6)
            );
            ctx.lineTo(
                ex - len * Math.cos(endAngle + Math.PI / 6),
                ey - len * Math.sin(endAngle + Math.PI / 6)
            );
            ctx.closePath();
            ctx.fill();

            // arrow at the start if bidirectional (use the first control point)
            if (bidirectional) {
                const startAngle = Math.atan2(sy - c1y, sx - c1x);
                ctx.beginPath();
                ctx.moveTo(sx, sy);
                ctx.lineTo(
                    sx - len * Math.cos(startAngle - Math.PI / 6),
                    sy - len * Math.sin(startAngle - Math.PI / 6)
                );
                ctx.lineTo(
                    sx - len * Math.cos(startAngle + Math.PI / 6),
                    sy - len * Math.sin(startAngle + Math.PI / 6)
                );
                ctx.closePath();
                ctx.fill();
            }
        };

        // Update the drawBezierAndArrow function to support double-headed arrows
        const drawBezierAndArrow = (
            ctx: CanvasRenderingContext2D,
            sx: number,
            sy: number,
            ex: number,
            ey: number,
            mode: "h" | "v",
            offset = 0,
            bidirectional = false
        ) => {
            // compute control points similar to previous implementation
            let c1x: number, c1y: number, c2x: number, c2y: number;
            if (mode === "h") {
                const dir = ex >= sx ? 1 : -1;
                c1x = sx + 40 * dir;
                c1y = sy + offset;
                c2x = ex - 40 * dir;
                c2y = ey + offset;
            } else {
                const dir = ey >= sy ? 1 : -1;
                c1x = sx + offset;
                c1y = sy + 40 * dir;
                c2x = ex + offset;
                c2y = ey - 40 * dir;
            }

            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.bezierCurveTo(c1x, c1y, c2x, c2y, ex, ey);
            ctx.stroke();

            // draw arrowhead at end point
            const endAngle = Math.atan2(ey - c2y, ex - c2x);
            const len = 10;
            ctx.beginPath();
            ctx.moveTo(ex, ey);
            ctx.lineTo(
                ex - len * Math.cos(endAngle - Math.PI / 6),
                ey - len * Math.sin(endAngle - Math.PI / 6)
            );
            ctx.lineTo(
                ex - len * Math.cos(endAngle + Math.PI / 6),
                ey - len * Math.sin(endAngle + Math.PI / 6)
            );
            ctx.closePath();
            ctx.fill();

            // draw arrowhead at start point if bidirectional
            if (bidirectional) {
                const startAngle = Math.atan2(sy - c1y, sx - c1x);
                ctx.beginPath();
                ctx.moveTo(sx, sy);
                ctx.lineTo(
                    sx - len * Math.cos(startAngle - Math.PI / 6),
                    sy - len * Math.sin(startAngle - Math.PI / 6)
                );
                ctx.lineTo(
                    sx - len * Math.cos(startAngle + Math.PI / 6),
                    sy - len * Math.sin(startAngle + Math.PI / 6)
                );
                ctx.closePath();
                ctx.fill();
            }
        };

        const draw = () => {
            const contRect = container.getBoundingClientRect();
            const width = contRect.width;
            const height = contRect.height;

            // setup canvas for high-DPI
            canvas.width = Math.max(1, Math.round(width * dpr));
            canvas.height = Math.max(1, Math.round(height * dpr));
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;

            const ctx = canvas.getContext("2d");
            if (!ctx) return;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, width, height);

            // color: try to read --primary from :root (shadcn/Tailwind setup uses var(--primary))
            const root = document.documentElement;
            const primaryVar =
                getComputedStyle(root).getPropertyValue("--primary");

            const stroke = primaryVar ? `${primaryVar}` : "#06b6d4"; // fallback cyan-500
            ctx.strokeStyle = stroke;
            ctx.fillStyle = stroke;
            ctx.lineWidth = 2;
            ctx.lineJoin = "round";
            ctx.lineCap = "round";

            // draw each edge
            EDGES.forEach((edge) => {
                const a = getRelRect(nodeRefs[edge.from].current);
                const b = getRelRect(nodeRefs[edge.to].current);
                if (!a || !b) return;

                // default side selection
                let { from, to, mode } = chooseSides(a, b);

                // Special-case: force world -> shop to originate from the LEFT side
                // of the world node and connect to the TOP of the shop.
                if (edge.from === "world" && edge.to === "shop") {
                    from = "left";
                    to = "top";
                    // Remove this line: mode = "mixed";
                }

                const s = anchorPoint(a, from);
                const e = anchorPoint(b, to);

                // For the world -> shop connection, we need custom control points
                if (edge.from === "world" && edge.to === "shop") {
                    drawCustomWorldToShop(
                        ctx,
                        s.x,
                        s.y,
                        e.x,
                        e.y,
                        edge.bidirectional
                    );
                } else {
                    drawBezierAndArrow(
                        ctx,
                        s.x,
                        s.y,
                        e.x,
                        e.y,
                        mode,
                        edge.offset ?? 0,
                        edge.bidirectional
                    );
                }
            });
        };

        // initial draw
        draw();

        // observe container and nodes -> redraw on resize
        const ro = new ResizeObserver(draw);
        ro.observe(container);
        Object.values(nodeRefs).forEach((r) => {
            if (r.current) ro.observe(r.current);
        });

        window.addEventListener("resize", draw);
        window.addEventListener("load", draw);

        return () => {
            ro.disconnect();
            window.removeEventListener("resize", draw);
            window.removeEventListener("load", draw);
        };
        // nodeRefs is stable (memoized), so it's safe to omit from deps
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Small helper to render a node (desktop grid)
    function NodeItem({ id, className }: { id: NodeId; className?: string }) {
        const refObj = nodeRefs[id];
        return (
            <div
                ref={refObj}
                className={`relative w-56 mx-auto ${className ?? ""}`}
            >
                <TooltipProvider delayDuration={200}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Card className="w-full shadow-sm hover:shadow-md transition-shadow">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg">
                                        {NODES[id].title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">
                                        {NODES[id].description}
                                    </p>
                                </CardContent>
                            </Card>
                        </TooltipTrigger>
                        {connectsTo[id].length > 0 ? (
                            <TooltipContent
                                side="bottom"
                                align="center"
                            >
                                <div className="text-xs">
                                    <div className="font-bold mb-1">
                                        Connects to
                                    </div>
                                    <ul className="space-y-0.5">
                                        {connectsTo[id].map((c) => (
                                            <li key={c}>{c}</li>
                                        ))}
                                    </ul>
                                </div>
                            </TooltipContent>
                        ) : null}
                    </Tooltip>
                </TooltipProvider>
            </div>
        );
    }

    return (
        <section
            id="integration-diagram"
            className="section-container py-24 sm:py-32"
        >
            <div className="text-center mb-12">
                <h2 className="text-lg text-primary mb-2 tracking-wider">
                    Tool Integration
                </h2>
                <h3 className="text-3xl md:text-4xl font-bold mb-4">
                    Visual Integration Diagram
                </h3>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    How generators and management tools are integrated. Arrows
                    show how tools connect: the arrow points to the tool being
                    used.
                </p>
            </div>

            {/* Desktop: 5-row grid layout with canvas overlay */}
            <div
                ref={containerRef}
                className="relative hidden md:grid w-full max-w-6xl mx-auto grid-cols-3
          gap-x-8 gap-y-12"
            >
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full pointer-events-none"
                />

                {/* Row 1 (center) */}
                <NodeItem
                    id="galaxy"
                    className="md:col-start-2 md:row-start-1"
                />
                {/* Row 2 (center) */}
                <NodeItem
                    id="system"
                    className="md:col-start-2 md:row-start-2"
                />
                {/* Row 3 (center) */}
                <NodeItem
                    id="world"
                    className="md:col-start-2 md:row-start-3"
                />
                {/* Row 4: Magic Shop in 1st column */}
                <NodeItem
                    id="shop"
                    className="md:col-start-1 md:row-start-4"
                />
                {/* Row 5: final row with three columns */}
                <NodeItem
                    id="battle"
                    className="md:col-start-1 md:row-start-5"
                />
                <NodeItem
                    id="encounter"
                    className="md:col-start-2 md:row-start-5"
                />
                <NodeItem
                    id="party"
                    className="md:col-start-3 md:row-start-5"
                />
            </div>

            {/* Mobile fallback: stacked flow */}
            <div className="md:hidden max-w-xl mx-auto">
                <ol className="relative border-l border-border pl-4 space-y-6">
                    <li>
                        <Card className="shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg">
                                    {NODES.galaxy.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm text-muted-foreground">
                                {NODES.galaxy.description}
                            </CardContent>
                        </Card>
                    </li>
                    <li>
                        <Card className="shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg">
                                    {NODES.system.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm text-muted-foreground">
                                {NODES.system.description}
                            </CardContent>
                        </Card>
                    </li>
                    <li>
                        <Card className="shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg">
                                    {NODES.world.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm text-muted-foreground">
                                {NODES.world.description}
                            </CardContent>
                        </Card>
                    </li>
                    <li>
                        <Card className="shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg">
                                    {NODES.shop.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm text-muted-foreground">
                                {NODES.shop.description}
                            </CardContent>
                        </Card>
                    </li>
                    <li>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Card className="shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base">
                                        {NODES.battle.title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground">
                                    {NODES.battle.description}
                                </CardContent>
                            </Card>
                            <Card className="shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base">
                                        {NODES.encounter.title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground">
                                    {NODES.encounter.description}
                                </CardContent>
                            </Card>
                            <Card className="shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base">
                                        {NODES.party.title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground">
                                    {NODES.party.description}
                                </CardContent>
                            </Card>
                        </div>
                    </li>
                </ol>
            </div>

            <div className="text-center mt-12">
                <p className="text-muted-foreground max-w-3xl mx-auto">
                    Start with any tool and seamlessly integrate with others.
                    Generate a world and automatically create battle maps for
                    encounters, or build a party and get perfectly balanced
                    encounters. The Magic Shop Generator adapts to your
                    world&apos;s settings, creating a cohesive campaign
                    experience.
                </p>
            </div>
        </section>
    );
}
