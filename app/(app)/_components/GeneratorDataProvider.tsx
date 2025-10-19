/** @format */

"use client";

import React, { createContext, useContext } from "react";
import db from "@/lib/db";

interface GeneratorData {
    parties: {
        isLoading: boolean;
        error: any;
        data: any;
    };
    spellbooks: {
        isLoading: boolean;
        error: any;
        data: any;
    };
    magicShops: {
        isLoading: boolean;
        error: any;
        data: any;
    };
}

const GeneratorDataContext = createContext<GeneratorData | null>(null);

export function useGeneratorData() {
    const context = useContext(GeneratorDataContext);
    if (!context) {
        throw new Error(
            "useGeneratorData must be used within GeneratorDataProvider"
        );
    }
    return context;
}

export function GeneratorDataProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    // Query all data at this level - it will stay mounted as users navigate
    const partiesQuery = db.useQuery({
        parties: { $files: {} },
    });

    const spellbooksQuery = db.useQuery({
        spellbooks: {},
    });

    const magicShopsQuery = db.useQuery({
        magicShops: {},
    });

    const value: GeneratorData = {
        parties: partiesQuery,
        spellbooks: spellbooksQuery,
        magicShops: magicShopsQuery,
    };

    return (
        <GeneratorDataContext.Provider value={value}>
            {children}
        </GeneratorDataContext.Provider>
    );
}
