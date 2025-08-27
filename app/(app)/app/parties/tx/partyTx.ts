/** @format */

import { tx } from "@instantdb/react";

/**
 * Build transact ops for creating/updating parties.
 * These return an ops array suitable for db.transact(ops).
 */

export function buildCreatePartyOps(
    newId: string,
    userId: string,
    name: string,
    pcs: any[],
    newFileId?: string | null
) {
    const ops: any[] = [];
    ops.push(
        tx.parties[newId].update({
            name,
            pcs,
            createdAt: Date.now(),
            creatorId: userId,
        })
    );
    if (newFileId) {
        ops.push(tx.parties[newId].link({ $files: newFileId }));
    }
    ops.push(tx.parties[newId].link({ $user: userId }));
    return ops;
}

export function buildUpdatePartyOps(
    id: string,
    name: string,
    pcs: any[],
    originalFileId?: string | null,
    removedIcon?: boolean,
    newFileId?: string | null
) {
    const ops: any[] = [];
    ops.push(tx.parties[id].update({ name, pcs }));

    if (removedIcon && originalFileId) {
        ops.push(tx.parties[id].unlink({ $files: originalFileId }));
    }

    if (newFileId) {
        if (originalFileId && originalFileId !== newFileId) {
            ops.push(tx.parties[id].unlink({ $files: originalFileId }));
        }
        ops.push(tx.parties[id].link({ $files: newFileId }));
    }

    return ops;
}
