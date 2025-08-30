/** @format */

"use client";

import { useEffect, useMemo, useState } from "react";
import db from "@/lib/db";

export type User = {
    name?: string | null;
    id: string | null;
    email?: string | null;
    avatar?: string | null;
} | null;

export function useUser(initialUser?: User) {
    const [user, setUser] = useState<User>(initialUser ?? null);

    // keep the same query shape you used in NavUser
    const query = { $users: { profile: { $files: {} } } };
    const { isLoading, error, data } = db.useQuery(query);

    const userInfo = data?.$users?.[0];

    useEffect(() => {
        if (!userInfo) return;
        setUser({
            name: userInfo.profile?.name ?? null,
            id: userInfo.id ?? null,
            email: userInfo.email ?? null,
            avatar: userInfo.profile?.$files?.url ?? null,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        userInfo?.profile?.name,
        userInfo?.email,
        userInfo?.profile?.$files?.url,
    ]);

    const displayName = useMemo(
        () => user?.name ?? userInfo?.profile?.name ?? "Account",
        [user?.name, userInfo?.profile?.name]
    );

    const displayEmail = useMemo(
        () => user?.email ?? userInfo?.email ?? "",
        [user?.email, userInfo?.email]
    );

    const avatarSrc = useMemo(
        () => user?.avatar ?? userInfo?.profile?.$files?.url ?? undefined,
        [user?.avatar, userInfo?.profile?.$files?.url]
    );

    const plan = useMemo(() => {
        const p = userInfo?.profile?.plan;
        return p ? p.charAt(0).toUpperCase() + p.slice(1) : p;
    }, [userInfo?.profile?.plan]);

    const signOut = async () => {
        await db.auth.signOut();
    };

    return {
        // state + setters
        user,
        setUser,

        // status + raw data
        isLoading,
        error,
        data,

        // derived fields convenient for UIs
        displayName,
        displayEmail,
        avatarSrc,
        plan,

        // actions
        signOut,
    };
}
