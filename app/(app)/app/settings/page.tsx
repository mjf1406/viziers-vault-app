/** @format */

import SettingsGate from "./_components/SettingsGate";

export default function SettingsPage() {
    return (
        <div className="w-full h-full space-y-6 p-6 text-left">
            <div className="text-4xl font-bold">Settings</div>
            <div className="grid gap-6">
                <SettingsGate />
            </div>
        </div>
    );
}
