/** @format */

import { DisclosureSection } from "../../_components/layout/sections/disclosure";
import { FooterSection } from "../../_components/layout/sections/footer";
import { NameExplanationSection } from "../../_components/layout/sections/name-explanation";
import { PhilosophySection } from "../../_components/layout/sections/philosophy";

export const metadata = {
    title: "Vizier's Vault - D&D 5e Tools",
    description:
        "Generate magic shops, encounters, spellbooks, battle maps, and worlds for D&D 5e 2024",
};

export default function PhilosophyPage() {
    return (
        <>
            <NameExplanationSection />
            <PhilosophySection />
            <DisclosureSection />
            <FooterSection />
        </>
    );
}
