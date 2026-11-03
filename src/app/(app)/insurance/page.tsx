import Link from "next/link";
import { requireCtx } from "@/lib/session";
import { fromDecimal128 } from "@/core/money";
import { Alert, Badge, Card, NoAccess, PageHeader, Table, Tabs, aed } from "@/ui/kit";
import { ActionButton, ActionForm, fmtDate, fmtDateTime } from "@/ui/forms";
import { listPayers, listPlans, listPreauths } from "@/modules/insurance/masters";
import { denialAnalysis, insuranceReceivables, listClaims } from "@/modules/insurance/claims";
import { patientNames } from "@/modules/patients/service";
import { listUnbilledCharges } from "@/modules/billing/charges";
import { listPolicies } from "@/modules/insurance/masters";
import { PatientPicker } from "../appointments/PatientPicker";

const TABS = [{ key: "claims", label: "Claims" }, { key: "setup", label: "Payers & plans" }, { key: "patient", label: "Insure a visit" }, { key: "preauth", label: "Pre-authorisation" }, { key: "recon", label: "Reconciliation" }];
const TONE: Record<string, "neutral" | "ok" | "warn" | "danger" | "info"> = { draft: "neutral", validated: "info", submitted: "info", accepted: "ok", rejected: "danger", partially_paid: "warn", paid: "ok", written_off: "neutral" };

export default async function InsurancePage({ searchParams }: { searchParams: Promise<{ tab?: string; error?: string; patientId?: string }> }) {
  const ctx = await requireCtx();
  const sp = await searchParams;
  if (!ctx.permissions.includes("insurance:view")) return <NoAccess what="insurance" />;
  const tab = TABS.some((t) => t.key === sp.tab) ? sp.tab! : "claims";
  const back = `/insurance?tab=${tab}`;
  const can = (p: string) => ctx.permissions.includes(p as never);
  const payers = await listPayers(ctx), plans = await listPlans(ctx);
  const pname = new Map(payers.map((p) => [p._id, p.name]));

  return (
    <div className="space-y-4">
      <PageHeader title="Insurance" sub="Eligibility, pre-authorisation, claims and remittance. Submission uses a SANDBOX connector: nothing is sent to any payer or regulator." />
      {sp.error && <Alert>{sp.error}</Alert>}
      <Tabs tabs={TABS} active={tab} base="/insurance" />

      {tab === "claims" && <Claims ctx={ctx} />}

      {tab === "setup" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Payers and TPAs">
            <Table head={["Name", "Code", "Kind"]} empty={payers.length ? undefined : "No payers yet."}>{payers.map((p) => <tr key={p._id}><td>{p.name}</td><td className="font-mono text-xs">{p.code}</td><td className="capitalize">{p.kind}</td></tr>)}</Table>
            {can("insurance:create") && <div className="mt-3 border-t border-border pt-3"><ActionForm action="ins.payer" back={back} submit="Add payer" fields={[{ name: "name", label: "Name", required: true }, { name: "code", label: "Code", required: true }, { name: "kind", label: "Kind", type: "select", options: ["insurer", "tpa"] }]} /></div>}
          </Card>
          <Card title="Plans">
            <Table head={["Plan", "Payer", "Co-pay", "Pre-auth for"]} empty={plans.length ? undefined : "No plans yet."}>{plans.map((p) => <tr key={p._id}><td>{p.name}</td><td>{pname.get(p.payerId)}</td><td>{p.copayPct}%{p.copayCapPerVisit ? ` (cap ${fromDecimal128(p.copayCapPerVisit).toFixed(2)})` : ""}</td><td className="text-xs">{p.preauthServiceCodes.join(", ") || "—"}</td></tr>)}</Table>
            {can("insurance:create") && payers.length > 0 && <div className="mt-3 border-t border-border pt-3"><ActionForm action="ins.plan" back={back} submit="Add plan" fields={[{ name: "payerId", label: "Payer", type: "select", options: payers.map((p) => ({ value: p._id, label: p.name })) }, { name: "name", label: "Plan name", required: true }, { name: "copayPct", label: "Co-pay %", type: "number", required: true, defaultValue: 20 }, { name: "cap", label: "Cap per visit (AED)" }, { name: "preauth", label: "Pre-auth service codes (comma separated)" }, { name: "exclusions", label: "Excluded service codes" }]} /></div>}
          </Card>
        </div>
      )}

      {tab === "patient" && <PatientTab ctx={ctx} patientId={sp.patientId} plans={plans} back={back} />}

      {tab === "preauth" && <Preauths ctx={ctx} back={back} />}

      {tab === "recon" && <Recon ctx={ctx} pname={pname} />}
    </div>
  );
}

type C = Awaited<ReturnType<typeof requireCtx>>;

async function Claims({ ctx }: { ctx: C }) {
  const rows = await listClaims(ctx);
  const names = await patientNames(ctx, rows.map((r) => r.patientId));
  return (
    <Card title={`Claims (${rows.length})`}>
      <Table head={["Claim", "Patient", "Payer share", "Outstanding", "Status"]} empty={rows.length ? undefined : "No claims yet. Insure a visit to create one."}>
        {rows.map((c) => <tr key={c._id}><td><Link className="text-primary hover:underline" href={`/insurance/claims/${c._id}`}>{c.number}</Link></td><td>{names.get(c.patientId)?.fullName}</td><td className="tabular-nums">{aed(fromDecimal128(c.total).toFixed(2))}</td><td className="tabular-nums">{aed(fromDecimal128(c.outstanding).toFixed(2))}</td><td><Badge tone={TONE[c.status]}>{c.status.replace("_", " ")}</Badge></td></tr>)}
      </Table>
    </Card>
  );
}

async function PatientTab({ ctx, patientId, plans, back }: { ctx: C; patientId?: string; plans: Awaited<ReturnType<typeof listPlans>>; back: string }) {
  const policies = patientId ? await listPolicies(ctx, patientId) : [];
  const charges = patientId ? await listUnbilledCharges(ctx, patientId) : [];
  return (
    <div className="space-y-4">
      <Card title="Find patient"><form className="flex gap-2"><input type="hidden" name="tab" value="patient" /><div className="flex-1"><PatientPicker /></div><button className="rounded-ui border border-border px-3 text-sm">Load</button></form></Card>
      {patientId && (
        <>
          <Card title="Policies">
            <Table head={["Member no.", "Valid", ""]} empty={policies.length ? undefined : "No policy on file."}>{policies.map((p) => <tr key={p._id}><td>{p.memberNo}</td><td>{fmtDate(p.startDate)} → {fmtDate(p.endDate)}</td><td className="font-mono text-xs">{p._id.slice(-6)}</td></tr>)}</Table>
            <div className="mt-3 grid gap-4 border-t border-border pt-3 lg:grid-cols-2">
              <ActionForm action="ins.policy" back={`${back}&patientId=${patientId}`} hidden={{ patientId }} submit="Add policy" fields={[{ name: "planId", label: "Plan", type: "select", options: plans.map((p) => ({ value: p._id, label: p.name })) }, { name: "memberNo", label: "Member number", required: true }, { name: "start", label: "Start", type: "date", required: true }, { name: "end", label: "End", type: "date", required: true }]} />
              {policies.length > 0 && <ActionForm action="ins.eligibility" back={`${back}&patientId=${patientId}`} hidden={{ patientId }} submit="Record check" variant="outline" fields={[{ name: "policyId", label: "Policy", type: "select", options: policies.map((p) => ({ value: p._id, label: p.memberNo })) }, { name: "result", label: "Result", type: "select", options: ["eligible", "not_eligible", "unknown"] }, { name: "reference", label: "Payer reference / call ID" }, { name: "notes", label: "Notes" }]} />}
            </div>
            <p className="mt-2 text-xs text-muted">Eligibility is recorded after staff verify with the payer (portal or phone). No live payer connection exists.</p>
          </Card>
          <Card title="Invoice unbilled charges to the payer">
            {charges.length === 0 ? <p className="text-sm text-muted">No unbilled charges for this patient.</p> : policies.length === 0 ? <p className="text-sm text-muted">Add a policy first.</p> : (
              <form action={(await import("@/app/(app)/dispatch")).dispatch} className="space-y-3">
                <input type="hidden" name="_a" value="ins.invoice" /><input type="hidden" name="_back" value={`${back}&patientId=${patientId}`} /><input type="hidden" name="patientId" value={patientId} />
                <Table head={["", "Service", "Qty", "Unit price"]}>{charges.map((c) => <tr key={c._id}><td><input type="checkbox" name="chargeId" value={c._id} defaultChecked /></td><td>{c.name}</td><td>{c.qty}</td><td>{aed(fromDecimal128(c.unitPrice).toFixed(2))}</td></tr>)}</Table>
                <div className="flex items-end gap-2"><select name="policyId" className="rounded-ui border border-border bg-surface px-3 py-2 text-sm">{policies.map((p) => <option key={p._id} value={p._id}>{p.memberNo}</option>)}</select><button className="rounded-ui bg-primary px-3 py-2 text-sm font-medium text-primary-fg">Create invoice and claim</button></div>
              </form>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

async function Preauths({ ctx, back }: { ctx: C; back: string }) {
  const rows = await listPreauths(ctx);
  const names = await patientNames(ctx, rows.map((r) => r.patientId));
  return (
    <Card title="Pre-authorisations">
      <Table head={["Patient", "Services", "Estimate", "Status", ""]} empty={rows.length ? undefined : "None."}>
        {rows.map((p) => <tr key={p._id}><td>{names.get(p.patientId)?.fullName}</td><td className="text-xs">{p.serviceCodes.join(", ")}</td><td>{aed(fromDecimal128(p.estimatedAmount).toFixed(2))}</td><td><Badge tone={p.status === "approved" ? "ok" : p.status === "rejected" ? "danger" : "warn"}>{p.status}</Badge>{p.reference && <span className="ms-1 text-xs text-muted">{p.reference}</span>}</td>
          <td>{p.status === "requested" && ctx.permissions.includes("insurance:approve") && <ActionForm inline action="ins.preauthDecide" back={back} hidden={{ id: p._id }} submit="Decide" variant="outline" fields={[{ name: "decision", label: "Decision", type: "select", options: ["approve", "reject"] }, { name: "reference", label: "Payer ref." }]} />}</td></tr>)}
      </Table>
      {ctx.permissions.includes("insurance:create") && <div className="mt-3 border-t border-border pt-3"><p className="mb-2 text-xs text-muted">Request for a patient (use the patient and policy IDs from the Insure a visit tab):</p><ActionForm action="ins.preauthRequest" back={back} submit="Request" fields={[{ name: "patientId", label: "Patient ID", required: true }, { name: "policyId", label: "Policy ID", required: true }, { name: "codes", label: "Service codes", required: true }, { name: "amount", label: "Estimated AED", required: true }]} /></div>}
    </Card>
  );
}

async function Recon({ ctx, pname }: { ctx: C; pname: Map<string, string> }) {
  const r = await insuranceReceivables(ctx);
  const d = await denialAnalysis(ctx);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="Outstanding by payer (must equal the ledger)">
        <Table head={["Payer", "Outstanding"]} empty={r.byPayer.length ? undefined : "Nothing outstanding."}>{r.byPayer.map((x) => <tr key={x.payerId}><td>{pname.get(x.payerId) ?? x.payerId}</td><td className="tabular-nums">{aed(x.amount.toFixed(2))}</td></tr>)}<tr className="font-semibold"><td>Total</td><td className="tabular-nums">{aed(r.total.toFixed(2))}</td></tr></Table>
        <p className="mt-2 text-xs text-muted">Aging: {Object.entries(r.aging).map(([k, v]) => `${k}d ${aed(v.toFixed(2))}`).join(" · ")}</p>
      </Card>
      <Card title="Denial reasons"><Table head={["Reason", "Count"]} empty={d.length ? undefined : "No denials recorded."}>{d.map((x) => <tr key={x.reason}><td>{x.reason}</td><td>{x.count}</td></tr>)}</Table></Card>
    </div>
  );
}
void ActionButton; void fmtDateTime;
