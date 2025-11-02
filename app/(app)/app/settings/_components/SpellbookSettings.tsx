/** @format */

"use client";

import React from "react";
import db from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Field,
    FieldGroup,
    FieldLabel,
    FieldDescription,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check } from "lucide-react";

type SettingsRow = {
    id?: string;
    spellbookExtraSpellsDice?: string | null;
};

const DEFAULTS: Required<Omit<SettingsRow, "id">> = {
    spellbookExtraSpellsDice: "",
};

export default function SpellbookSettings() {
    const { user } = db.useAuth();
    const { isLoading, error, data } = db.useQuery({ settings: {} });

    const row: SettingsRow | null = React.useMemo(() => {
        const r = (data?.settings?.[0] as any) ?? null;
        if (!r) return null;
        return {
            id: r.id,
            spellbookExtraSpellsDice: r.spellbookExtraSpellsDice ?? null,
        };
    }, [data?.settings]);

    const [form, setForm] = React.useState<SettingsRow>(() => ({
        spellbookExtraSpellsDice:
            row?.spellbookExtraSpellsDice ?? DEFAULTS.spellbookExtraSpellsDice,
    }));

    React.useEffect(() => {
        setForm({
            spellbookExtraSpellsDice:
                row?.spellbookExtraSpellsDice ??
                DEFAULTS.spellbookExtraSpellsDice,
        });
    }, [row?.id]);

    const [isSaving, setIsSaving] = React.useState(false);
    const [wasSaved, setWasSaved] = React.useState(false);
    const saveTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
        null
    );
    React.useEffect(() => {
        return () => {
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        };
    }, []);

    const updateField = (key: keyof SettingsRow, value: any) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const save = async () => {
        if (!user?.id) {
            toast.error("You must be signed in to save settings");
            return;
        }
        setIsSaving(true);
        try {
            const payload: any = {
                spellbookExtraSpellsDice: (form.spellbookExtraSpellsDice ?? "")
                    .toString()
                    .trim(),
            };

            const ops: any[] = [];
            if ((row?.id ?? null) != null) {
                ops.push(db.tx.settings[row!.id!].update(payload));
            } else {
                ops.push(
                    db.tx.settings[user.id]
                        .create(payload)
                        .link({ owner: user.id })
                );
            }
            await db.transact(ops);
            setWasSaved(true);
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
            saveTimerRef.current = setTimeout(() => setWasSaved(false), 1000);
        } catch (e) {
            console.error(e);
            toast.error("Failed to save settings");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div>Loading settings…</div>;
    if (error)
        return <div className="text-destructive">Failed to load settings</div>;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Spellbook Generator Settings</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field>
                            <FieldLabel>Extra spells</FieldLabel>
                            <Input
                                type="text"
                                placeholder="e.g. 2d6 + 3"
                                value={form.spellbookExtraSpellsDice ?? ""}
                                onChange={(e) =>
                                    updateField(
                                        "spellbookExtraSpellsDice",
                                        e.target.value
                                    )
                                }
                            />
                            <FieldDescription>
                                Expression to add extra spells after selection.
                                Examples: 4, -6, *2, /1.5, 2d6, 2d6 + 3, 3d6 -
                                1d8 + 2. Leave blank for none.
                            </FieldDescription>
                        </Field>
                    </FieldGroup>

                    <div className="flex justify-end">
                        <Button
                            onClick={() => void save()}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                "Saving…"
                            ) : wasSaved ? (
                                <span className="inline-flex items-center gap-2">
                                    <Check className="w-4 h-4 text-current" />
                                    Saved
                                </span>
                            ) : (
                                "Save Spellbook settings"
                            )}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
