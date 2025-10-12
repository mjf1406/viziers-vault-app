/** @format */

"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dices } from "lucide-react";

export type SpellbookNameFieldProps = {
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
];

const NOUNS = [
    "Grimoire",
    "Tome",
    "Codex",
    "Manuscript",
    "Compendium",
    "Lexicon",
    "Treatise",
    "Primer",
    "Spellbook",
    "Scroll",
    "Chronicle",
    "Archive",
    "Journal",
    "Ledger",
    "Bestiary",
    "Almanac",
    "Folio",
    "Opus",
    "Atlas",
    "Dossier",
    "Vademecum",
    "Enchiridion",
    "Manual",
    "Concordance",
    "Phylactery",
];

function pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

export function randomSpellbookName(): string {
    const name = pick(FIRST_NAMES);
    const possessive = name.endsWith("s") ? `${name}'` : `${name}'s`;
    const useAdj = Math.random() < 0.65;
    const adjective = useAdj ? `${pick(ADJECTIVES)} ` : "";
    const noun = pick(NOUNS);
    return `${possessive} ${adjective}${noun}`;
}

export default function SpellbookNameField({
    value,
    onChange,
    id = "name",
    nameAttr = "name",
    placeholder = "e.g., Neera's Apprentice Grimoire",
    label = "Name (optional)",
    className,
    buttonAriaLabel = "Randomize name",
}: SpellbookNameFieldProps) {
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
                    onClick={() => onChange(randomSpellbookName())}
                >
                    <Dices className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
