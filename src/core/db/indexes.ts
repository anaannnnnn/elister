import { getDb } from "./client";

type Idx = [collection: string, keys: Record<string, 1 | -1>, opts?: { unique?: boolean; partialFilterExpression?: object }];

/** Central registry; modules append their indexes here. */
export const INDEXES: Idx[] = [
  ["t_docs", { orgId: 1 }],
  ["audit_log", { orgId: 1, at: -1 }],
  ["audit_log", { orgId: 1, resource: 1, resourceId: 1, at: -1 }],
  ["outbox", { status: 1, nextAttemptAt: 1 }],
];

INDEXES.push(
  ["appointments", { orgId: 1, doctorId: 1, start: 1 }],
  ["appointments", { orgId: 1, patientId: 1, start: -1 }],
  ["slot_locks", { orgId: 1, doctorId: 1, day: 1 }, { unique: true }],
  ["time_off", { orgId: 1, doctorId: 1, start: 1 }],
);

INDEXES.push(
  ["queue_tokens", { orgId: 1, branchId: 1, day: 1, number: 1 }, { unique: true }],
  ["queue_tokens", { orgId: 1, doctorId: 1, status: 1, priority: -1, number: 1 }],
  ["queue_tokens", { orgId: 1, appointmentId: 1 }],
);

export async function ensureIndexes(): Promise<void> {
  const db = await getDb();
  for (const [name, keys, opts] of INDEXES) await db.collection(name).createIndex(keys, opts);
}

INDEXES.push(
  ["counters", { orgId: 1, key: 1 }, { unique: true }],
  ["orgs", { orgId: 1 }, { unique: true }],
  ["branches", { orgId: 1, code: 1 }, { unique: true }],
  ["departments", { orgId: 1, code: 1 }, { unique: true }],
  ["staff", { orgId: 1, userKey: 1 }, { unique: true }],
  ["services", { orgId: 1, code: 1 }, { unique: true }],
  ["tax_codes", { orgId: 1, code: 1 }, { unique: true }],
  ["accounts", { orgId: 1, code: 1 }, { unique: true }],
  ["fiscal_periods", { orgId: 1, year: 1, month: 1 }, { unique: true }],
  ["memberships", { userId: 1 }],
);

INDEXES.push(
  ["patients", { orgId: 1, mrn: 1 }, { unique: true }],
  ["patients", { orgId: 1, emiratesIdHash: 1 }],
  ["patients", { orgId: 1, fullName: 1, dob: 1 }],
);
