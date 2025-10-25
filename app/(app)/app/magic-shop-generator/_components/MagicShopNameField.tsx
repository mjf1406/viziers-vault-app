/** @format */

"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dices } from "lucide-react";

export type MagicShopNameFieldProps = {
    value: string;
    onChange: (v: string) => void;
    id?: string;
    nameAttr?: string;
    placeholder?: string;
    label?: string;
    className?: string;
    buttonAriaLabel?: string;
};

const FIRST_NAMES = [
    "Neera",
    "Kael",
    "Mira",
    "Thorne",
    "Eldric",
    "Seraphine",
    "Orin",
    "Lyra",
    "Bram",
    "Elowen",
    "Corvin",
    "Isolde",
    "Galen",
    "Tamsin",
    "Rowan",
    "Nyx",
    "Silas",
    "Iria",
    "Dorian",
    "Vesper",
    "Ariadne",
    "Kieran",
    "Maelis",
    "Alaric",
    "Sable",
    "Riven",
    "Sorrel",
    "Astra",
    "Cassian",
    "Eira",
    "Beelzebub",
    "Lucien",
    "Ophelia",
    "Balthazar",
    "Morgaine",
    "Coraline",
    "Talon",
    "Vaelis",
    "Azrael",
    "Aelwyn",
    "Aeron",
    "Aislinn",
    "Althea",
    "Amaranth",
    "Amaris",
    "Amon",
    "Ansel",
    "Aradia",
    "Arlen",
    "Armand",
    "Astrid",
    "Azura",
    "Beren",
    "Cael",
    "Caius",
    "Calista",
    "Cassiel",
    "Celyn",
    "Damaris",
    "Eamon",
    "Elysia",
    "Emrys",
    "Fenris",
    "Fiora",
    "Gideon",
    "Hale",
    "Imara",
    "Ishara",
    "Jareth",
    "Kaida",
    "Kestrel",
    "Leofric",
    "Liora",
    "Marius",
    "Neriah",
    "Nyssa",
    "Oberon",
    "Peregrin",
    "Quillon",
    "Ragnar",
    "Rhea",
    "Soren",
    "Sylvaine",
    "Theron",
    "Ulric",
    "Valen",
    "Wren",
    "Xanthe",
    "Yara",
    "Zephyrus",
    "Zara",
    "Alessia",
    "Briar",
    "Caspian",
    "Dara",
    "Evin",
    "Faelan",
    "Gwyneth",
    "Hadria",
    "Ilian",
    "Jora",
    "Korra",
    "Lysander",
    "Merrin",
    "Nimue",
    "Orrin",
    "Phaedra",
    "Quen",
    "Rhoswen",
    "Saelos",
    "Thalia",
    "Ursin",
    "Vala",
    "Wystan",
    "Xara",
    "Ysolde",
    "Zeren",
    "Osmund",
    "Sibylla",
    "Vireo",
    "Luneth",
    "Helios",
    "Miron",
    "Sableus",
    "Magnus",
    "Violetta",
    "Rinoa",
    "Fenn",
    "Anwen",
    "Garrick",
    "Isidore",
    "Luthien",
    "Morden",
    "Nox",
    "Oriel",
    "Pax",
    "Quilla",
    "Rook",
    "Selene",
    "Thessaly",
    "Uther",
    "Vanya",
    "Yves",
    "Zephyr",
    "Alina",
    "Belgar",
];

const ADJECTIVES = [
    "Apprentice",
    "Arcane",
    "Eldritch",
    "Umbral",
    "Gilded",
    "Forgotten",
    "Cursed",
    "Hallowed",
    "Whispered",
    "Primeval",
    "Runed",
    "Starbound",
    "Abyssal",
    "Verdant",
    "Obsidian",
    "Sanguine",
    "Shimmering",
    "Ancient",
    "Occult",
    "Sealed",
    "Shadowed",
    "Burnished",
    "Enigmatic",
    "Astral",
    "Stormbound",
    "Midnight",
    "Moonlit",
    "Sunforged",
    "Crystal",
    "Frostbound",
    "Emberbound",
    "Gloombound",
    "Nether",
    "Liminal",
    "Celestial",
    "Radiant",
    "Luminous",
    "Nocturnal",
    "Ethereal",
    "Wyrmforged",
    "Dragonmarked",
    "Ironbound",
    "Glassbound",
    "Stormforged",
    "Thunderous",
    "Tidebound",
    "Seaborne",
    "Vaporous",
    "Glacial",
    "Thorned",
    "Venomous",
    "Corrupted",
    "Purified",
    "Sanctified",
    "Veiled",
    "Silent",
    "Echoing",
    "Eclipsed",
    "Mossbound",
    "Starforged",
    "Moonshadowed",
    "Sigiled",
    "Glyphic",
    "Cindered",
    "Hollowed",
    "Soulbound",
    "Faded",
    "Mirrored",
    "Silvered",
    "Auric",
    "Ebony",
    "Ivory",
    "Vermilion",
    "Cerulean",
    "Opaline",
    "Gossamer",
    "Umber",
    "Starlit",
    "Brimstone",
    "Runewrought",
    "Lucky",
    "Dusty",
    "Antique",
    "Rare",
    "Curious",
    "Twilit",
    "Feytouched",
    "Runic",
    "Magisterial",
    "Prismatic",
    "Mossy",
    "Rustic",
    "Golden",
    "Silken",
    "Mystic",
    "Fabled",
    "Arcadian",
    "Clockwork",
    "Everburning",
    "Songbound",
    "Lantern-lit",
];

const SHOP_NOUNS = [
    "Emporium",
    "Curio",
    "Curios",
    "Curiosities",
    "Apothecary",
    "Oddities",
    "Bazaar",
    "Atelier",
    "Mercantile",
    "Parlor",
    "Wares",
    "Wonders",
    "Trinkets",
    "Antiques",
    "General Store",
    "Outfitter",
    "Supply",
    "Gifts",
    "Artifacts",
    "Relics",
    "Vault",
    "Cellar",
    "Workshop",
    "Boutique",
    "Exchange",
    "Galleria",
    "Studio",
    "Archive",
    "Cabinet",
    "Shoppe",
    "House",
    "Market",
    "Stall",
    "Alcove",
    "Nook",
    "Niche",
    "Menagerie",
    "Arcanum",
    "Arcana",
    "Spellworks",
    "Enchantery",
    "Charmshop",
    "Phylactery",
];

function pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function pickTwoDifferent<T>(arr: T[]): [T, T] {
    if (arr.length < 2) return [arr[0], arr[0]];
    const a = pick(arr);
    let b = pick(arr);
    // ensure different when possible
    let attempts = 0;
    while (b === a && attempts < 10) {
        b = pick(arr);
        attempts++;
    }
    return [a, b];
}

export function randomMagicShopName(): string {
    const name = pick(FIRST_NAMES);
    const lastChar = name.slice(-1).toLowerCase();
    const possessive = lastChar === "s" ? `${name}'` : `${name}'s`;
    const roll = Math.random();

    // helper to optionally include an adjective
    const maybeAdj = (prob = 0.7) =>
        Math.random() < prob ? `${pick(ADJECTIVES)} ` : "";

    if (roll < 0.45) {
        // Owner possessive: "Neera's Gilded Emporium"
        return `${possessive} ${maybeAdj()}${pick(SHOP_NOUNS)}`;
    }

    if (roll < 0.7) {
        // The-style: "The Moonlit Parlor"
        return `The ${maybeAdj()}${pick(SHOP_NOUNS)}`;
    }

    if (roll < 0.82) {
        // Compound: "Gilded Curios & Whispered Wares"
        const [adj1, adj2] = pickTwoDifferent(ADJECTIVES);
        const [noun1, noun2] = pickTwoDifferent(SHOP_NOUNS);
        return `${adj1} ${noun1} & ${adj2} ${noun2}`;
    }

    if (roll < 0.9) {
        // "The Emporium of Kael"
        return `The ${pick(SHOP_NOUNS)} of ${name}`;
    }

    if (roll < 0.96) {
        // House of-style: "House of Moonshadowed Wonders"
        return `House of ${maybeAdj(0.9)}${pick(SHOP_NOUNS)}`;
    }

    // fallback simple: "Gilded Emporium" or "Arcana"
    return `${maybeAdj(0.85)}${pick(SHOP_NOUNS)}`;
}

export default function MagicShopNameField({
    value,
    onChange,
    id = "shopName",
    nameAttr = "shopName",
    placeholder = "e.g., Neera's Gilded Emporium",
    label = "Shop name",
    className,
    buttonAriaLabel = "Randomize shop name",
}: MagicShopNameFieldProps) {
    return (
        <div className={className}>
            <Label
                htmlFor={id}
                className="mb-2"
            >
                {label}
            </Label>
            <div className="mt-1 flex items-center gap-2">
                <Input
                    id={id}
                    name={nameAttr}
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="flex-1"
                />
                <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    aria-label={buttonAriaLabel}
                    title={buttonAriaLabel}
                    onClick={() => onChange(randomMagicShopName())}
                >
                    <Dices className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
