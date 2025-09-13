/** @format */

import { FooterSection } from "../../_components/layout/sections/footer";
import { TeamSection } from "../../_components/layout/sections/team";

export const metadata = {
    title: "Vizier's Vault - D&D 5e Tools",
    description:
        "Generate magic shops, encounters, spellbooks, battle maps, and worlds for D&D 5e 2024",
};

export default function TeamPage() {
    return (
        <>
            <TeamSection />
            <FooterSection />
        </>
    );
}
