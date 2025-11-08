/** @format */

/**
 * Build transact ops for creating/updating parties.
 * These return an ops array suitable for db.transact(ops).
 * @param db - The InstantDB database instance (needed for db.tx)
 */

export function buildCreatePartyOps(
    db: any,
    newId: string,
    userId: string,
    name: string,
    pcs: any[],
    newFileId?: string | null
) {
    // Create the party first
    const createOp = db.tx.parties[newId].create({
        name,
        pcs,
        createdAt: new Date(),
    });
    
    // Link owner separately first
    const withOwner = createOp.link({ owner: userId });
    
    // Then link icon if provided
    if (newFileId) {
        return [withOwner.link({ icon: newFileId })];
    }
    
    return [withOwner];
}

export function buildUpdatePartyOps(
    db: any,
    id: string,
    name: string,
    pcs: any[],
    originalFileId?: string | null,
    removedIcon?: boolean,
    newFileId?: string | null
) {
    const ops: any[] = [];
    ops.push(db.tx.parties[id].update({ name, pcs }));

    if (removedIcon && originalFileId) {
        ops.push(db.tx.parties[id].unlink({ icon: originalFileId }));
    }

    if (newFileId) {
        if (originalFileId && originalFileId !== newFileId) {
            ops.push(db.tx.parties[id].unlink({ icon: originalFileId }));
        }
        ops.push(db.tx.parties[id].link({ icon: newFileId }));
    }

    return ops;
}

