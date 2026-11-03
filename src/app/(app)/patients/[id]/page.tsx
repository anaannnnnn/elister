import Link from "next/link";
import { requireCtx } from "@/lib/session";
import { getPatient } from "@/modules/patients/service";
import { listPatientAppointments } from "@/modules/appointments/service";
import { listPatientEncounters } from "@/modules/emr/service";
import { listPatientInvoices } from "@/modules/billing/invoice";
import { fromDecimal128 } from "@/core/money";
import { Alert, Badge, Card, NoAccess, PageHeader, Table, aed, cn } from "@/ui/kit";

const TABS = ["overview", "appointments", "encounters", "invoices", "timeline"] as const;
type Tab = (typeof TABS)[number];
const fmt = (d: Date) => new Date(d).toLocaleString("en-GB", { timeZone: "Asia/Dubai", dateStyle: "medium", timeStyle: "short" });

export default async function PatientPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string; dup?: string }> }) {
  const ctx = await requireCtx();
  const { id } = await params;
  const sp = await searchParams;
  if (!ctx.permissions.includes("patients:view")) return <NoAccess what="patient records" />;
  const tab: Tab = (TABS as readonly string[]).includes(sp.tab ?? "") ? (sp.tab as Tab) : "overview";
  const p = await getPatient(ctx, id);
  const can = (perm: string) => ctx.permissions.includes(perm as never);

  const appts = can("appointments:view") ? await listPatientAppointments(ctx, id) : [];
  const encs = can("emr:view") ? await listPatientEncounters(ctx, id) : [];
  const invs = can("billing:view") ? await listPatientInvoices(ctx, id) : [];

  const events = [
    ...appts.map((a) => ({ at: a.start, kind: "Appointment", text: `${a.type} — ${a.status.replace("_", " ")}`, href: undefined as string | undefined })),
    ...encs.map((e) => ({ at: e.openedAt, kind: "Encounter", text: `Consultation ${e.status}`, href: `/encounters/${e._id}` })),
    ...invs.map((i) => ({ at: i.createdAt, kind: "Invoice", text: `${i.number} — ${aed(fromDecimal128(i.total).toFixed(2))} (${i.status.replace("_", " ")})`, href: `/billing/invoices/${i._id}` })),
  ].sort((a, b) => +new Date(b.at) - +new Date(a.at));

  return (
    <div className="space-y-4">
      {sp.dup && <Alert tone="warn">{sp.dup} possible duplicate record(s) found for this identity. Review before proceeding.</Alert>}
      <PageHeader
        title={<>{p.fullName} {p.fullNameAr && <span dir="rtl" className="ms-2 text-base text-muted">{p.fullNameAr}</span>}</>}
        sub={<span className="font-mono">{p.mrn}</span>}
        actions={can("appointments:create") && <Link className="rounded-ui bg-primary px-3 py-2 text-sm font-medium text-primary-fg" href={`/appointments?patient=${id}`}>Book appointment</Link>}
      />
      {(p.allergies.length > 0 || p.alerts.length > 0) && (
        <div className="flex flex-wrap gap-2" aria-label="Clinical alerts">
          {p.allergies.map((a, i) => <Badge key={i} tone="danger">Allergy: {a.substance}{a.severity ? ` (${a.severity})` : ""}</Badge>)}
          {p.alerts.map((a, i) => <Badge key={i} tone="warn">{a}</Badge>)}
        </div>
      )}
      <nav className="flex gap-1 border-b border-border" aria-label="Patient sections">
        {TABS.map((t) => (
          <Link key={t} href={`?tab=${t}`} aria-current={t === tab ? "page" : undefined}
            className={cn("-mb-px border-b-2 px-3 py-2 text-sm capitalize", t === tab ? "border-primary font-medium text-primary" : "border-transparent text-muted hover:text-fg")}>{t}</Link>
        ))}
      </nav>

      {tab === "overview" && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card title="Demographics">
            <dl className="grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-muted">Date of birth</dt><dd>{p.dob}</dd>
              <dt className="text-muted">Sex</dt><dd className="capitalize">{p.sex}</dd>
              <dt className="text-muted">Nationality</dt><dd>{p.nationality ?? "—"}</dd>
              <dt className="text-muted">Emirates ID</dt><dd className="font-mono text-xs">{p.emiratesIdMasked ?? "—"}</dd>
              <dt className="text-muted">Language</dt><dd>{p.preferredLanguage === "ar" ? "العربية" : "English"}</dd>
            </dl>
          </Card>
          <Card title="Contact">
            <dl className="grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-muted">Mobile</dt><dd dir="ltr" className="text-start">{p.phone}</dd>
              <dt className="text-muted">Email</dt><dd>{p.email ?? "—"}</dd>
              <dt className="text-muted">Address</dt><dd>{p.address ?? "—"}</dd>
              <dt className="text-muted">Marketing consent</dt><dd>{p.commPrefs?.marketing ? <Badge tone="ok">Opted in</Badge> : <Badge>No</Badge>}</dd>
            </dl>
          </Card>
        </div>
      )}

      {tab === "appointments" && (
        <Card><Table head={["When (Dubai)", "Type", "Status"]} empty={appts.length ? undefined : "No appointments."}>
          {appts.map((a) => <tr key={a._id}><td>{fmt(a.start)}</td><td className="capitalize">{a.type}</td><td><Badge tone={a.status === "completed" ? "ok" : a.status === "no_show" || a.status === "cancelled" ? "danger" : "info"}>{a.status.replace("_", " ")}</Badge></td></tr>)}
        </Table></Card>
      )}
      {tab === "encounters" && (
        <Card>{!can("emr:view") ? <p className="text-sm text-muted">Clinical records are not available to your role.</p> : (
          <Table head={["Opened", "Status", ""]} empty={encs.length ? undefined : "No encounters."}>
            {encs.map((e) => <tr key={e._id}><td>{fmt(e.openedAt)}</td><td><Badge tone={e.status === "completed" ? "ok" : "info"}>{e.status}</Badge></td><td className="text-end"><Link className="text-primary hover:underline" href={`/encounters/${e._id}`}>Open</Link></td></tr>)}
          </Table>)}
        </Card>
      )}
      {tab === "invoices" && (
        <Card><Table head={["Invoice", "Date", "Total", "Balance", "Status"]} empty={invs.length ? undefined : "No invoices."}>
          {invs.map((i) => <tr key={i._id}><td><Link className="text-primary hover:underline" href={`/billing/invoices/${i._id}`}>{i.number}</Link></td><td>{fmt(i.createdAt)}</td><td>{aed(fromDecimal128(i.total).toFixed(2))}</td><td>{aed(fromDecimal128(i.balance).toFixed(2))}</td><td><Badge tone={i.status === "paid" ? "ok" : i.status === "credited" ? "neutral" : "warn"}>{i.status.replace("_", " ")}</Badge></td></tr>)}
        </Table></Card>
      )}
      {tab === "timeline" && (
        <Card>
          {events.length === 0 ? <p className="text-sm text-muted">No events yet.</p> : (
            <ol className="relative space-y-4 border-s border-border ps-5">
              {events.map((e, i) => (
                <li key={i} className="relative">
                  <span className="absolute -start-[1.65rem] top-1 size-2.5 rounded-full bg-primary" aria-hidden />
                  <div className="text-xs text-muted">{fmt(e.at)} · {e.kind}</div>
                  <div className="text-sm">{e.href ? <Link className="text-primary hover:underline" href={e.href}>{e.text}</Link> : e.text}</div>
                </li>
              ))}
            </ol>
          )}
        </Card>
      )}
    </div>
  );
}
