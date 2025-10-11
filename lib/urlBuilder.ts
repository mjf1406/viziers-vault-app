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

    // If already an acronym (e.g. phb, xge, ftd)
    if (/^[a-z]{2,6}$/i.test(s)) {
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
        "tasha's cauldron of everything": "tce",
        "tashas cauldron of everything": "tce",
        "sword coast adventurer's guide": "scag",
        "sword coast adventurers guide": "scag",
        "mordenkainen presents: monsters of the multiverse": "mpmm",
        "elemental evil player's companion": "xge",
        "fizban's treasury of dragons": "ftd",
        "strixhaven: a curriculum of chaos": "sato",
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
    // D&D Beyond provider
    if (provider === "dndbeyond") {
        // If we already have the full URL, use it directly
        if (spell?.url && typeof spell.url === "string") {
            return spell.url;
        }

        // Otherwise construct from dndbeyondId and slug
        const id = spell?.dndbeyondId;
        const slug = spell?.slug;

        if (!id || !slug) return null;

        return `https://www.dndbeyond.com/spells/${id}-${slug}`;
    }

    // Custom template provider
    const baseUrl = prefs?.baseUrl ?? "https://5e.tools/spells.html#";
    const argPattern =
        prefs?.argPattern ?? "${SPELL_NAME_LOWER}_${SOURCE_SHORT}";
    const spaceReplacement =
        typeof prefs?.spaceReplacement === "string"
            ? prefs.spaceReplacement
            : "%20";

    // Get fields from spell object - try multiple field name variations
    const spellName = spell?.name || spell?.NAME || "";
    const spellNameLower =
        spell?.nameLower || spell?.name_lower || spellName.toLowerCase();
    const slug = spell?.slug || spell?.SLUG || "";
    const sourceShortRaw =
        spell?.sourceShort ||
        spell?.source_short ||
        spell?.source ||
        spell?.SOURCE ||
        "";

    if (!spellName && !slug) return null;

    // Apply space replacement (respect user's setting)
    const toToken = (s: string) => {
        return String(s || "").replace(/\s+/g, spaceReplacement);
    };

    const token = toToken(spellName);
    const tokenLower = toToken(spellNameLower);
    const slugToken = slug; // Slug is pre-formatted
    const sourceShort = normalizeSourceShort(sourceShortRaw);

    // Apply replacements per argument pattern
    let filled = String(argPattern);
    filled = filled.replaceAll("${SPELL_NAME}", token);
    filled = filled.replaceAll("${SPELL_NAME_LOWER}", tokenLower);
    filled = filled.replaceAll("${SPELL_NAME_SLUG}", slugToken);
    filled = filled.replaceAll("${SLUG}", slugToken);
    filled = filled.replaceAll("${SOURCE_SHORT}", sourceShort);
    filled = filled.replaceAll("${SOURCE}", sourceShortRaw);

    // Defensive replacements for items/monsters
    filled = filled.replaceAll("${ITEM_NAME}", token);
    filled = filled.replaceAll("${MONSTER_NAME}", token);

    return `${baseUrl}${filled}`;
}
