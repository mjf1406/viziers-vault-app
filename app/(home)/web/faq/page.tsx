/** @format */

import { FAQSection } from "../../_components/layout/sections/faq";
import { FooterSection } from "../../_components/layout/sections/footer";

export const metadata = {
    title: "Vizier's Vault - D&D 5e Tools",
    description:
        "Generate magic shops, encounters, spellbooks, battle maps, and worlds for D&D 5e 2024",
    openGraph: {
        type: "website",
        url: "https://www.viziersvault.com",
        title: "Vizier's Vault - D&D 5e Tools",
        description:
            "Generate magic shops, encounters, spellbooks, battle maps, and worlds for D&D 5e 2024",
        images: [
            {
                url: "/hero-image-light.jpeg",
                width: 1200,
                height: 630,
                alt: "Vizier's Vault - D&D 5e Tools",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        site: "https://www.viziersvault.com",
        title: "Vizier's Vault - D&D 5e Tools",
        description:
            "Generate magic shops, encounters, spellbooks, battle maps, and worlds for D&D 5e 2024",
        images: ["/hero-image-light.jpeg"],
    },
};

export default function PhilosophyPage() {
    return (
        <>
            <FAQSection />
            <FooterSection />
        </>
    );
}
