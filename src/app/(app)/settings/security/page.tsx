import { requireCtx } from "@/lib/session";
import { PageHeader, Card } from "@/ui/kit";
import { MfaSetup } from "./MfaSetup";

export default async function SecurityPage() {
  const ctx = await requireCtx();
  return (
    <div className="mx-auto max-w-lg space-y-4">
      <PageHeader title="Security" sub={ctx.email} />
      <Card title="Two-factor authentication (TOTP)"><MfaSetup /></Card>
      <Card title="Your access"><p className="text-sm text-muted">Roles: {ctx.roles.join(", ").replaceAll("_", " ")}. Every action is permission-checked on the server and written to the audit log.</p></Card>
    </div>
  );
}
