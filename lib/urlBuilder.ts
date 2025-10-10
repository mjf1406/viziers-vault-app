/** @format */

export type SpellUrlProvider = "dndbeyond" | "custom" | string;

export type SpellUrlPrefs = {
    provider?: SpellUrlProvider;
    baseUrl?: string | null;
    argPattern?: string | null; // e.g. "${SPELL_NAME}" or "${SPELL_NAME}_${SOURCE_SHORT}"
    spaceReplacement?: string | null; // e.g. "-", "%20", or " "
};

export type UrlPreferences = {
    spells?: SpellUrlPrefs | null;
    items?: {
        provider?: SpellUrlProvider;
        baseUrl?: string | null;
        argPattern?: string | null; // e.g. "${ITEM_NAME}"
        spaceReplacement?: string | null;
    } | null;
    monsters?: {
        provider?: SpellUrlProvider;
        baseUrl?: string | null;
        argPattern?: string | null; // e.g. "${MONSTER_NAME}"
        spaceReplacement?: string | null;
    } | null;
} | null;

function normalizeSourceShort(raw: unknown): string {
    const s = String(raw || "").trim();
    if (!s) return "";

    // If already an acronym (e.g. PHB, XGE, XPHB)
    if (/^[A-Za-z]{2,6}$/.test(s)) {
        return s.toLowerCase();
    }

    // Common source mappings
    const map: Record<string, string> = {
        "player's handbook (2024)": "xphb",
        "players handbook (2024)": "xphb",
        "player's handbook": "phb",
        "players handbook": "phb",
        "dungeon master's guide": "dmg",
        "dungeons masters guide": "dmg",
        "monster manual": "mm",
        "xanathar's guide to everything": "xge",
        "xanathars guide to everything": "xge",
        "tasha's cauldron of everything": "tcoe",
        "tashas cauldron of everything": "tcoe",
        "sword coast adventurer's guide": "scag",
        "sword coast adventurers guide": "scag",
        "mordenkainen presents: monsters of the multiverse": "mpmm",
    };
    const key = s.toLowerCase();
    if (map[key]) return map[key];

    // Fallback: take first letters of up to 5 words, letters only
    const letters = key
        .replace(/[^a-zA-Z\s]/g, " ")
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 5)
        .map((w) => w[0])
        .join("");
    return letters || s.toLowerCase();
}

export function buildSpellUrl(
    spell: any,
    prefs?: SpellUrlPrefs | null
): string | null {
    const provider = (prefs?.provider ?? "dndbeyond").toString();

    // Try strict D&D Beyond: requires id and slug
    if (provider === "dndbeyond") {
        const id = spell?.dndbeyondId || spell?.dndbeyond_id;
        const slugRaw = spell?.slug || spell?.SLUG || spell?.name;
        if (!id || !slugRaw) return null;
        const slug = String(slugRaw).toLowerCase().replace(/\s+/g, "-");
        return `https://www.dndbeyond.com/spells/${id}-${slug}`;
    }

    // Default/custom template
    const baseUrl = prefs?.baseUrl ?? "https://open5e.com/spells/";
    const argPattern = prefs?.argPattern ?? "${SPELL_NAME}";
    const spaceReplacement =
        typeof prefs?.spaceReplacement === "string"
            ? prefs!.spaceReplacement!
            : "-";

    const nameRaw = spell?.name || spell?.NAME || spell?.slug || "";
    const sourceShortRaw = spell?.sourceShort || spell?.source || "";

    const toToken = (s: string) =>
        String(s || "").replace(/\s+/g, spaceReplacement);

    const spellName = String(nameRaw);
    const token = toToken(spellName);
    const tokenLower = token.toLowerCase();
    const sourceShort = normalizeSourceShort(sourceShortRaw);

    // Apply replacements per argument pattern
    let filled = String(argPattern);
    filled = filled.replaceAll("${SPELL_NAME}", token);
    filled = filled.replaceAll("${SPELL_NAME_LOWER}", tokenLower);
    // Also replace item/monster tokens defensively using the same name
    filled = filled.replaceAll("${ITEM_NAME}", token);
    filled = filled.replaceAll("${MONSTER_NAME}", token);
    filled = filled.replaceAll("${SOURCE_SHORT}", sourceShort);

    return `${baseUrl}${filled}`;
}
