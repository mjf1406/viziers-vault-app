/** @format */

export function parseLevel(levelText?: string): number | undefined {
    if (!levelText) return undefined;
    const lc = levelText.toLowerCase();
    if (lc.includes("cantrip")) return 0;
    const m = lc.match(/^\s*(\d+)/);
    return m ? Number(m[1]) : undefined;
}

export function parseCR(crText?: string): number | undefined {
    if (!crText) return undefined;
    const t = String(crText).trim();
    if (t.includes("/")) {
        const [a, b] = t.split("/");
        const n = Number(a);
        const d = Number(b);
        return Number.isFinite(n) && Number.isFinite(d) && d !== 0
            ? n / d
            : undefined;
    }
    const n = Number(t);
    return Number.isFinite(n) ? n : undefined;
}
