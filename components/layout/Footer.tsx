/** @format */

import React from "react";

export function Footer() {
    return (
        <footer className="border-t mt-8 py-6 text-center text-sm text-muted-foreground">
            <div className="px-4">
                © {new Date().getFullYear()} Vizier's Vault. All rights
                reserved.
            </div>
        </footer>
    );
}
