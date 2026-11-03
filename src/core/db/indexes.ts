import { getDb } from "./client";

type Idx = [collection: string, keys: Record<string, 1 | -1>, opts?: { unique?: boolean; partialFilterExpression?: object }];

/** Central registry; modules append their indexes here. */
export const INDEXES: Idx[] = [
  ["t_docs", { orgId: 1 }],
  ["audit_log", { orgId: 1, at: -1 }],
  ["audit_log", { orgId: 1, resource: 1, resourceId: 1, at: -1 }],
  ["outbox", { status: 1, nextAttemptAt: 1 }],
];

export async function ensureIndexes(): Promise<void> {
  const db = await getDb();
  for (const [name, keys, opts] of INDEXES) await db.collection(name).createIndex(keys, opts);
}
