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
    let authUser;
    try {
        authUser = db.useUser();
    } catch (e: any) {
        authUser = null;
        if (
            e.message! != "useUser must be used within an auth-protected route"
        ) {
            console.error(e);
            throw e;
        }
    }

    const query = { $users: { profile: { $files: {} } } };
    const { isLoading, error, data } = db.useQuery(query);
    const userInfo = data?.$users?.[0];

    useEffect(() => {
        if (!authUser?.id) {
            setUser(null);
            return;
        }
        if (user?.id !== authUser.id) {
            setUser((prev) => ({ ...(prev ?? {}), id: authUser.id }));
        }
    }, [authUser?.id, user?.id]);

    useEffect(() => {
        if (!userInfo) return;
        setUser({
            name: userInfo.profile?.name ?? null,
            id: userInfo.id ?? null,
            email: userInfo.email ?? null,
            avatar: userInfo.profile?.$files?.url ?? null,
        });
    }, [
        userInfo?.profile?.name,
        userInfo?.email,
        userInfo?.profile?.$files?.url,
        userInfo?.id,
    ]);

    const loggedIn = Boolean(authUser?.id);

    const displayName = useMemo(() => {
        if (!loggedIn) return null;
        return user?.name ?? userInfo?.profile?.name ?? "Account";
    }, [loggedIn, user?.name, userInfo?.profile?.name]);

    const displayEmail = useMemo(() => {
        if (!loggedIn) return null;
        return user?.email ?? userInfo?.email ?? null;
    }, [loggedIn, user?.email, userInfo?.email]);

    const avatarSrc = useMemo(() => {
        if (!loggedIn) return null;
        return user?.avatar ?? userInfo?.profile?.$files?.url ?? null;
    }, [loggedIn, user?.avatar, userInfo?.profile?.$files?.url]);

    const plan = useMemo(() => {
        if (!loggedIn) return null;
        const p = userInfo?.profile?.plan;
        return p ? p.charAt(0).toUpperCase() + p.slice(1) : p ?? null;
    }, [loggedIn, userInfo?.profile?.plan]);

    const signOut = async () => {
        setUser(null);
        await db.auth.signOut();
    };

    return {
        user,
        setUser,
        isLoading,
        error,
        data,
        displayName,
        displayEmail,
        avatarSrc,
        plan,
        signOut,
    };
}
