/** @format */

import { BenefitsSection } from "./_components/layout/sections/benefits";
import { FeaturesSection } from "./_components/layout/sections/features";
import { FooterSection } from "./_components/layout/sections/footer";
import { HeroSection } from "./_components/layout/sections/hero";
import { ToolsSection } from "./_components/layout/sections/tools";

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

export default function HomePage() {
    return (
        <>
            <HeroSection />
            <ToolsSection />
            <FeaturesSection />
            <BenefitsSection />
            <FooterSection />
        </>
    );
}
