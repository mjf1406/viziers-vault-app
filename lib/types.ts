/** @format */

// lib/types.ts

import { AppSchema } from "@/instant.schema";
import { InstaQLEntity } from "@instantdb/react";

export type InstantFile = InstaQLEntity<AppSchema, "$files">;
