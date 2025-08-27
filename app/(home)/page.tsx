/** @format */

import { BenefitsSection } from "./_components/layout/sections/benefits";
import { CommunitySection } from "./_components/layout/sections/community";
import { ContactSection } from "./_components/layout/sections/contact";
import { DisclosureSection } from "./_components/layout/sections/disclosure";
import { FAQSection } from "./_components/layout/sections/faq";
import { FeaturesSection } from "./_components/layout/sections/features";
import { FooterSection } from "./_components/layout/sections/footer";
import { HeroSection } from "./_components/layout/sections/hero";
import { IntegrationSection } from "./_components/layout/sections/integration";
import { PhilosophySection } from "./_components/layout/sections/philosophy";
import { PricingSection } from "./_components/layout/sections/pricing";
import { ServicesSection } from "./_components/layout/sections/services";
import { TeamSection } from "./_components/layout/sections/team";

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
        <div className="w-full">
            <HeroSection />
            <FeaturesSection />
            <IntegrationSection />
            <PhilosophySection />
            <ServicesSection />
            <BenefitsSection />
            <PricingSection />
            <DisclosureSection />
            <CommunitySection />
            <FAQSection />
            <ContactSection />
            <TeamSection />
            <FooterSection />
        </div>
    );
}
