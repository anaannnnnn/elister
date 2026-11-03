import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { twoFactor } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { headers } from "next/headers";
import { getDbLazy } from "../db/client";
import { getDb } from "../db/client";
import { permissionsFor, type RoleKey } from "../rbac/roles";
import { setCtxResolver, type Ctx } from "../rbac/authorize";

function build() {
  return betterAuth({
    database: mongodbAdapter(getDbLazy()),
    secret: process.env.AUTH_SECRET,
    emailAndPassword: { enabled: true, minPasswordLength: 12, autoSignIn: true },
    session: { expiresIn: 60 * 60 * 8, updateAge: 60 * 15, cookieCache: { enabled: false } },
    plugins: [twoFactor({ issuer: "UAE Healthcare OS" }), nextCookies()],
  });
}

type Auth = ReturnType<typeof build>;
let instance: Auth | undefined;
export function getAuth(): Auth {
  return (instance ??= build());
}

export type Membership = { userId: string; orgId: string; branchId: string; roles: RoleKey[]; active: boolean; patientId?: string };

export async function loadCtx(userId: string): Promise<Ctx | null> {
  const db = await getDb();
  const m = await db.collection<Membership>("memberships").findOne({ userId, active: true });
  if (!m) return null;
  return { userId, orgId: m.orgId, branchId: m.branchId, roles: m.roles, permissions: permissionsFor(m.roles), ...(m.patientId ? { patientId: m.patientId } : {}) };
}

setCtxResolver(async () => {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session?.user) return null;
  return loadCtx(session.user.id);
});
