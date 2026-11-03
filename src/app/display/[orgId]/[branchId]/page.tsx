import { notFound } from "next/navigation";
import { publicBoard } from "@/modules/queue/service";
import { RefreshEvery } from "./RefreshEvery";

export const metadata = { title: "Queue display" };

/**
 * Public waiting-room screen. Shows token numbers and status only: no patient names or clinical data.
 * Protected by a shared display key (DISPLAY_KEY) so org/branch ids alone are not enough.
 */
export default async function DisplayPage({ params, searchParams }: { params: Promise<{ orgId: string; branchId: string }>; searchParams: Promise<{ key?: string }> }) {
  const { orgId, branchId } = await params;
  const { key } = await searchParams;
  if (!process.env.DISPLAY_KEY || key !== process.env.DISPLAY_KEY) notFound();
  const rows = await publicBoard(orgId, decodeURIComponent(branchId));
  const now = rows.filter((r) => r.status === "called" || r.status === "in_consult");
  const waiting = rows.filter((r) => r.status === "waiting");
  return (
    <main className="min-h-screen bg-[#0b1317] p-8 text-white">
      <RefreshEvery seconds={5} />
      <h1 className="mb-6 text-3xl font-semibold">Now serving</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {now.map((r) => (
          <div key={r.number} className="rounded-2xl border border-teal-400/40 bg-teal-400/10 p-6"><div className="text-6xl font-bold tabular-nums">{r.number}</div><div className="mt-2 text-xl text-teal-200">{r.doctorLabel}</div></div>
        ))}
        {now.length === 0 && <p className="text-xl text-white/60">—</p>}
      </div>
      <h2 className="mb-3 mt-10 text-xl text-white/70">Waiting</h2>
      <div className="flex flex-wrap gap-3">{waiting.map((r) => <span key={r.number} className="rounded-xl bg-white/10 px-4 py-2 text-2xl font-semibold tabular-nums">{r.number}</span>)}</div>
    </main>
  );
}
