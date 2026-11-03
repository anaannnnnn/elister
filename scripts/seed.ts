import { config } from "dotenv";
config({ path: ".env.local" });

import { ensureIndexes, getDb, closeClient } from "../src/core/db";
import { seedOrg, DEMO_DOCTORS } from "../src/modules/org/seed";
import { getAuth } from "../src/core/auth";
import type { RoleKey } from "../src/core/rbac/roles";

// Synthetic demo accounts. Password is demo-only; override with SEED_PASSWORD.
const PASSWORD = process.env.SEED_PASSWORD ?? "Demo-Only-Pass-2026!";
const USERS: { email: string; name: string; roles: RoleKey[]; userKey?: string }[] = [
  { email: "admin@demo.local", name: "Demo Admin", roles: ["org_admin"] },
  { email: "reception@demo.local", name: "Demo Receptionist", roles: ["receptionist"] },
  ...DEMO_DOCTORS.map((d) => ({ email: `${d.userKey}@demo.local`, name: d.name, roles: ["doctor"] as RoleKey[], userKey: d.userKey })),
  { email: "nurse@demo.local", name: "Demo Nurse", roles: ["nurse"] },
  { email: "accountant@demo.local", name: "Demo Accountant", roles: ["accountant"] },
  { email: "finance@demo.local", name: "Demo Finance Manager", roles: ["finance_manager"] },
  { email: "pharmacist@demo.local", name: "Demo Pharmacist", roles: ["pharmacist"] },
  { email: "auditor@demo.local", name: "Demo Auditor", roles: ["auditor"] },
];

async function main() {
  await ensureIndexes();
  const { orgId, branchId } = await seedOrg();
  const ctx = await getAuth().$context;
  const db = await getDb();
  for (const u of USERS) {
    let user = await ctx.internalAdapter.findUserByEmail(u.email, { includeAccounts: false }).then((r) => r?.user);
    if (!user) {
      user = await ctx.internalAdapter.createUser({ email: u.email, name: u.name, emailVerified: true }, "seed" as never);
      await ctx.internalAdapter.linkAccount({
        userId: user.id, providerId: "credential", accountId: user.id, password: await ctx.password.hash(PASSWORD),
      });
    }
    await db.collection("memberships").updateOne(
      { userId: user.id },
      { $set: { userId: user.id, orgId, branchId, roles: u.roles, active: true } },
      { upsert: true },
    );
    if (u.userKey) await db.collection("staff").updateOne({ orgId, userKey: u.userKey }, { $set: { userId: user.id } });
  }
  console.log(`Seeded org ${orgId} with ${USERS.length} synthetic users. Password: ${PASSWORD}`);
}

main().then(() => closeClient()).catch(async (e) => { console.error(e); await closeClient(); process.exit(1); });
