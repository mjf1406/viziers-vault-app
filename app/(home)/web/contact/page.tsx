/** @format */

import { ContactSection } from "../../_components/layout/sections/contact";
import { FooterSection } from "../../_components/layout/sections/footer";

export const metadata = {
    title: "Vizier's Vault - D&D 5e Tools",
    description:
        "Generate magic shops, encounters, spellbooks, battle maps, and worlds for D&D 5e 2024",
};

export default function ContactPage() {
    return (
        <>
            <ContactSection />
            <FooterSection />
        </>
    );
}
