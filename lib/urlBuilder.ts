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
    items?: SpellUrlPrefs | null;
    monsters?: SpellUrlPrefs | null;
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
        if (spell?.url && typeof spell.url === "string") {
            return spell.url;
        }

        const id = spell?.dndbeyondId;
        const slug = spell?.slug;

        if (!id || !slug) return null;

        return `https://www.dndbeyond.com/spells/${id}-${slug}`;
    }

    // Custom template provider
    const sourceShortRaw =
        spell?.sourceShort ||
        spell?.source_short ||
        spell?.source ||
        spell?.SOURCE ||
        "";

    // Fallback to spell.url if source is missing
    if (!sourceShortRaw && spell?.url && typeof spell.url === "string") {
        return spell.url;
    }

    const spellName = spell?.name || spell?.NAME || "";
    const spellNameLower =
        spell?.nameLower || spell?.name_lower || spellName.toLowerCase();
    const slug = spell?.slug || spell?.SLUG || "";

    if (!spellName && !slug) return null;

    const baseUrl = prefs?.baseUrl ?? "";
    const argPattern = prefs?.argPattern ?? "${SPELL_NAME}";
    const spaceReplacement =
        typeof prefs?.spaceReplacement === "string"
            ? prefs.spaceReplacement
            : "-";

    const toToken = (s: string) =>
        String(s || "").replace(/\s+/g, spaceReplacement);

    const token = toToken(spellName);
    const tokenLower = toToken(spellNameLower);
    const slugToken = slug;
    const sourceShort = normalizeSourceShort(sourceShortRaw);

    let filled = String(argPattern)
        .replaceAll("${SPELL_NAME}", token)
        .replaceAll("${SPELL_NAME_LOWER}", tokenLower)
        .replaceAll("${SPELL_NAME_SLUG}", slugToken)
        .replaceAll("${SLUG}", slugToken)
        .replaceAll("${SOURCE_SHORT}", sourceShort)
        .replaceAll("${SOURCE}", sourceShortRaw)
        .replaceAll("${ITEM_NAME}", token)
        .replaceAll("${MONSTER_NAME}", token);

    // Require a base URL for custom providers; otherwise no valid link
    if (!baseUrl) return null;
    return `${baseUrl}${filled}`;
}

export function buildItemUrl(
    item: any,
    prefs?: SpellUrlPrefs | null
): string | null {
    const provider = (prefs?.provider ?? "dndbeyond").toString();

    // D&D Beyond provider
    if (provider === "dndbeyond") {
        if (item?.url && typeof item.url === "string") {
            return item.url;
        }
        const id = item?.dndbeyondId;
        const slug = item?.slug;
        if (!id || !slug) return null;
        return `https://www.dndbeyond.com/magic-items/${id}-${slug}`;
    }

    // Custom template provider
    const sourceShortRaw =
        item?.sourceShort || item?.source_short || item?.source || "";

    if (!sourceShortRaw && item?.url && typeof item.url === "string") {
        return item.url;
    }

    const itemName = item?.name || item?.NAME || "";
    const itemNameLower =
        item?.nameLower || item?.name_lower || itemName.toLowerCase();
    const slug = item?.slug || item?.SLUG || "";

    if (!itemName && !slug) return null;

    const baseUrl = prefs?.baseUrl ?? "";
    const argPattern = prefs?.argPattern ?? "${ITEM_NAME}";
    const spaceReplacement =
        typeof prefs?.spaceReplacement === "string"
            ? prefs.spaceReplacement
            : "-";

    const toToken = (s: string) =>
        String(s || "").replace(/\s+/g, spaceReplacement);

    const token = toToken(itemName);
    const tokenLower = toToken(itemNameLower);
    const slugToken = slug;
    const sourceShort = normalizeSourceShort(sourceShortRaw);

    let filled = String(argPattern)
        .replaceAll("${ITEM_NAME}", token)
        .replaceAll("${ITEM_NAME_LOWER}", tokenLower)
        .replaceAll("${ITEM_NAME_SLUG}", slugToken)
        .replaceAll("${SLUG}", slugToken)
        .replaceAll("${SOURCE_SHORT}", sourceShort)
        .replaceAll("${SOURCE}", sourceShortRaw)
        .replaceAll("${SPELL_NAME}", token)
        .replaceAll("${MONSTER_NAME}", token);

    // Require a base URL for custom providers; otherwise no valid link
    if (!baseUrl) return null;
    return `${baseUrl}${filled}`;
}
