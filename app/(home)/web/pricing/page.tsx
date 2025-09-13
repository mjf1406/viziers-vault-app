/** @format */

import { FooterSection } from "../../_components/layout/sections/footer";
import { PricingSection } from "../../_components/layout/sections/pricing";
import { PlanFeaturesSection } from "./_components/FeaturesExplainerSection";

export const metadata = {
    title: "Vizier's Vault - D&D 5e Tools",
    description:
        "Generate magic shops, encounters, spellbooks, battle maps, and worlds for D&D 5e 2024",
};

export default function PricingPage() {
    return (
        <>
            <PricingSection />
            <PlanFeaturesSection />
            <FooterSection />
        </>
    );
}
