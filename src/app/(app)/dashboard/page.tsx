import { requireCtx } from "@/lib/session";
import { parseRange } from "@/lib/range";
import { executiveDashboard } from "@/modules/dashboard/executive";
import { receptionDashboard } from "@/modules/dashboard/reception";
import { doctorDashboard } from "@/modules/dashboard/doctor";
import { accountsDashboard } from "@/modules/dashboard/accounts";
import { Badge, Button, Card, Input, PageHeader, Stat, aed } from "@/ui/kit";

type SP = Promise<{ from?: string; to?: string }>;

const pct = (v: number | null) => (v === null ? "—" : `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`);

export default async function DashboardPage({ searchParams }: { searchParams: SP }) {
  const ctx = await requireCtx();
  const sp = await searchParams;
  const { from, to, fromStr, toStr } = parseRange(sp);
  const can = (p: string) => ctx.permissions.includes(p as never);

  const exec = can("reports:view") ? await executiveDashboard(ctx, { from, to }) : null;
  const reception = can("appointments:view") && can("queue:view") ? await receptionDashboard(ctx, { day: new Date() }) : null;
  const doctor = ctx.roles.includes("doctor") ? await doctorDashboard(ctx, { day: new Date() }).catch(() => null) : null;
  const accounts = can("ledger:view") ? await accountsDashboard(ctx, { day: new Date() }) : null;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Dashboard"
        sub={`Welcome, ${ctx.name}`}
        actions={exec && (
          <form className="flex items-end gap-2">
            <Input name="from" type="date" defaultValue={fromStr} aria-label="From" />
            <Input name="to" type="date" defaultValue={toStr} aria-label="To" />
            <Button variant="outline">Apply</Button>
          </form>
        )}
      />

      {exec && (
        <section aria-label="Executive KPIs" className="space-y-3">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Revenue" value={aed(exec.current.revenue)} hint={`${pct(exec.delta.revenue.pct)} vs previous period`} />
            <Stat label="Net profit" value={aed(exec.current.netProfit)} hint={`${pct(exec.delta.netProfit.pct)} vs previous`} />
            <Stat label="Outstanding receivables" value={aed(exec.current.outstandingReceivables)} tone={Number(exec.current.outstandingReceivables) > 0 ? "warn" : undefined} />
            <Stat label="Appointments" value={exec.current.appointments} hint={`${pct(exec.delta.appointments.pct)} vs previous`} />
            <Stat label="New patients" value={exec.current.newPatients} />
            <Stat label="Returning patients" value={exec.current.returningPatients} />
            <Stat label="No-show rate" value={`${(exec.current.noShowRate * 100).toFixed(1)}%`} />
            <Stat label="Avg wait (min)" value={exec.current.avgWaitMinutes.toFixed(1)} />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Card title="Revenue by doctor"><Bars rows={exec.current.revenueByDoctor} /></Card>
            <Card title="Revenue by department"><Bars rows={exec.current.revenueByDepartment} /></Card>
          </div>
        </section>
      )}

      {reception && (
        <section aria-label="Reception" className="space-y-3">
          <h2 className="text-sm font-semibold text-muted">Reception — today</h2>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <Stat label="Appointments" value={reception.todaysAppointments} />
            <Stat label="Expected arrivals" value={reception.expectedArrivals} />
            <Stat label="Waiting" value={reception.patientsWaiting} tone={reception.patientsWaiting > 5 ? "warn" : undefined} />
            <Stat label="In consultation" value={reception.inConsult} />
            <Stat label="No-shows" value={reception.noShows} />
          </div>
        </section>
      )}

      {doctor && (
        <section aria-label="Doctor" className="space-y-3">
          <h2 className="text-sm font-semibold text-muted">My day</h2>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Consultations" value={doctor.todaysConsultations} />
            <Stat label="Waiting" value={doctor.waitingPatients} />
            <Stat label="Unsigned notes" value={doctor.pendingNotes} tone={doctor.pendingNotes ? "warn" : undefined} />
            <Stat label="Current patient" value={doctor.currentPatient ? <Badge tone="info">In consult</Badge> : "—"} />
          </div>
        </section>
      )}

      {accounts && (
        <section aria-label="Accounts" className="space-y-3">
          <h2 className="text-sm font-semibold text-muted">Finance — today</h2>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Cash collected" value={aed(accounts.cashCollected)} />
            <Stat label="Card collected" value={aed(accounts.cardCollected)} />
            <Stat label="Daily sales" value={aed(accounts.dailySales)} />
            <Stat label="Open invoices" value={accounts.outstandingInvoices} hint={`Receivables ${aed(accounts.receivablesTotal)}`} />
          </div>
        </section>
      )}

      {!exec && !reception && !doctor && !accounts && <Card><p className="text-sm text-muted">No dashboard widgets are available for your role.</p></Card>}
    </div>
  );
}

function Bars({ rows }: { rows: { key: string; amount: string }[] }) {
  if (!rows.length) return <p className="text-sm text-muted">No revenue in this period.</p>;
  const max = Math.max(...rows.map((r) => Number(r.amount)), 1);
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.key} className="text-sm">
          <div className="mb-1 flex justify-between"><span className="truncate">{r.key}</span><span className="tabular-nums">{aed(r.amount)}</span></div>
          <div className="h-2 rounded-full bg-surface-2" role="img" aria-label={`${r.key}: ${r.amount}`}><div className="h-2 rounded-full bg-primary" style={{ width: `${(Number(r.amount) / max) * 100}%` }} /></div>
        </li>
      ))}
    </ul>
  );
}
