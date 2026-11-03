"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Activity, Bell, BedDouble, BookOpen, Bot, CalendarDays, Command, FlaskConical, Heart, Landmark, LayoutDashboard, ListOrdered, MessageSquare, Moon, PanelLeftClose, PanelLeftOpen, Pill, Receipt, ShieldCheck, ClipboardCheck, Sun, UserCog, Users, Package } from "lucide-react";
import { cn } from "@/ui/kit";

const ICONS = { dash: LayoutDashboard, users: Users, cal: CalendarDays, queue: ListOrdered, bill: Receipt, book: BookOpen, shield: ShieldCheck, med: Pill, flask: FlaskConical, box: Package, people: UserCog, heart: Heart, chat: MessageSquare, check: ClipboardCheck, bank: Landmark, bed: BedDouble, bot: Bot } as const;
type Item = { href: string; label: string; icon: keyof typeof ICONS };

export function Shell({
  items, quick, orgName, branch, userName, roles, locale, dir, labels, setLocale, signOut, unread, children,
}: {
  items: Item[]; quick: { href: string; label: string }[]; orgName: string; branch: string; userName: string; roles: string;
  locale: string; dir: "ltr" | "rtl"; labels: { language: string; signOut: string; search: string };
  setLocale: () => Promise<void>; signOut: () => Promise<void>; unread: number; children: ReactNode;
}) {
  const path = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [dark, setDark] = useState(false);
  const [open, setOpen] = useState(false);

  /* Browser-only state (theme class, saved sidebar state) can only be read after mount. */
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = locale;
    setDark(document.documentElement.classList.contains("dark"));
    try { setCollapsed(localStorage.getItem("nav-collapsed") === "1"); } catch { /* storage unavailable */ }
  }, [dir, locale]);
  /* eslint-enable react-hooks/set-state-in-effect */
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen((o) => !o); } };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    try { localStorage.setItem("theme", next ? "dark" : "light"); } catch { /* ignore */ }
    setDark(next);
  };
  const toggleNav = () => {
    setCollapsed((c) => { try { localStorage.setItem("nav-collapsed", c ? "0" : "1"); } catch { /* ignore */ } return !c; });
  };

  const crumbs = path.split("/").filter(Boolean);

  return (
    <div dir={dir} lang={locale} className="flex min-h-screen">
      <aside className={cn("no-print sticky top-0 hidden h-screen shrink-0 flex-col border-e border-border bg-surface transition-[width] md:flex", collapsed ? "w-16" : "w-60")}>
        <div className="flex h-14 items-center gap-2 border-b border-border px-3">
          <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-fg"><Activity size={16} /></div>
          {!collapsed && <div className="min-w-0"><div className="truncate text-sm font-semibold">{orgName}</div><div className="truncate text-xs text-muted">{branch}</div></div>}
        </div>
        <nav aria-label="Primary" className="flex-1 space-y-1 p-2">
          {items.map((i) => {
            const Icon = ICONS[i.icon];
            const active = path === i.href || path.startsWith(i.href + "/");
            return (
              <Link key={i.href} href={i.href} title={i.label} aria-current={active ? "page" : undefined}
                className={cn("flex items-center gap-3 rounded-ui px-3 py-2 text-sm", active ? "bg-primary/10 font-medium text-primary" : "text-muted hover:bg-surface-2 hover:text-fg")}>
                <Icon size={17} className="shrink-0" />
                {!collapsed && <span className="truncate">{i.label}</span>}
              </Link>
            );
          })}
        </nav>
        <button onClick={toggleNav} aria-label="Toggle sidebar" className="m-2 flex items-center gap-2 rounded-ui px-3 py-2 text-xs text-muted hover:bg-surface-2">
          {collapsed ? <PanelLeftOpen size={16} /> : <><PanelLeftClose size={16} /> Collapse</>}
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-surface/90 px-4 backdrop-blur">
          <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1 text-sm text-muted sm:flex">
            <Link href="/dashboard" className="hover:text-fg">Home</Link>
            {crumbs.map((c, i) => (
              <span key={i} className="flex items-center gap-1"><span aria-hidden>/</span><span className={cn("truncate capitalize", i === crumbs.length - 1 && "text-fg")}>{decodeURIComponent(c).slice(0, 24)}</span></span>
            ))}
          </nav>
          <div className="ms-auto flex items-center gap-1.5">
            <button onClick={() => setOpen(true)} className="flex items-center gap-2 rounded-ui border border-border px-3 py-1.5 text-xs text-muted hover:bg-surface-2" aria-label="Open command palette">
              <Command size={14} /> {labels.search} <kbd className="rounded border border-border px-1">Ctrl K</kbd>
            </button>
            <Link href="/notifications" aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`} className="relative rounded-ui p-2 hover:bg-surface-2"><Bell size={16} />{unread > 0 && <span className="absolute -end-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">{unread > 9 ? "9+" : unread}</span>}</Link>
            <form action={setLocale}><button className="rounded-ui px-2.5 py-1.5 text-xs hover:bg-surface-2" aria-label="Switch language">{labels.language}</button></form>
            <button onClick={toggleTheme} aria-label="Toggle theme" className="rounded-ui p-2 hover:bg-surface-2">{dark ? <Sun size={16} /> : <Moon size={16} />}</button>
            <div className="hidden text-end text-xs leading-tight sm:block"><div className="font-medium">{userName}</div><div className="text-muted">{roles}</div></div>
            <form action={signOut}><button className="rounded-ui border border-border px-2.5 py-1.5 text-xs hover:bg-surface-2">{labels.signOut}</button></form>
          </div>
        </header>
        <MobileNav items={items} path={path} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
      {open && <Palette onClose={() => setOpen(false)} entries={[...items.map((i) => ({ href: i.href, label: i.label })), ...quick]} />}
    </div>
  );
}

function MobileNav({ items, path }: { items: Item[]; path: string }) {
  return (
    <nav aria-label="Mobile" className="no-print flex gap-1 overflow-x-auto border-b border-border bg-surface px-2 py-1.5 md:hidden">
      {items.map((i) => (
        <Link key={i.href} href={i.href} className={cn("shrink-0 rounded-ui px-3 py-1.5 text-xs", path.startsWith(i.href) ? "bg-primary/10 text-primary" : "text-muted")}>{i.label}</Link>
      ))}
    </nav>
  );
}

function Palette({ entries, onClose }: { entries: { href: string; label: string }[]; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => ref.current?.focus(), []);
  const list = useMemo(() => entries.filter((e) => e.label.toLowerCase().includes(q.toLowerCase())), [entries, q]);
  const go = (href: string) => { onClose(); window.location.assign(href); };
  return (
    <div role="dialog" aria-modal="true" aria-label="Command palette" className="fixed inset-0 z-50 grid place-items-start justify-center bg-black/40 p-4 pt-24" onClick={onClose}>
      <div className="w-full max-w-md overflow-hidden rounded-ui border border-border bg-surface shadow-xl" onClick={(e) => e.stopPropagation()}>
        <input ref={ref} value={q} onChange={(e) => { setQ(e.target.value); setIdx(0); }} placeholder="Type a command or page…"
          className="w-full border-b border-border bg-transparent px-4 py-3 text-sm outline-none"
          onKeyDown={(e) => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => Math.min(i + 1, list.length - 1)); }
            if (e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)); }
            if (e.key === "Enter" && list[idx]) go(list[idx].href);
          }} />
        <ul className="max-h-72 overflow-auto p-1">
          {list.map((e, i) => (
            <li key={e.href + e.label}>
              <button onClick={() => go(e.href)} onMouseEnter={() => setIdx(i)} className={cn("w-full rounded-ui px-3 py-2 text-start text-sm", i === idx && "bg-surface-2")}>{e.label}</button>
            </li>
          ))}
          {list.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted">No results</li>}
        </ul>
      </div>
    </div>
  );
}
