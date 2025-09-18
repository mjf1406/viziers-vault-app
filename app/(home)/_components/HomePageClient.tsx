/** @format */

"use client";

import React from "react";
import { HeroSection } from "../_components/layout/sections/hero";
import { ToolsSection } from "../_components/layout/sections/tools";
import { FeaturesSection } from "../_components/layout/sections/features";
import { BenefitsSection } from "../_components/layout/sections/benefits";
import { FooterSection } from "../_components/layout/sections/footer";

export default function HomePageClient() {
    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div suppressHydrationWarning>
            <HeroSection />
            <ToolsSection />
            <FeaturesSection />
            <BenefitsSection />
            <FooterSection />
        </div>
    );
}
