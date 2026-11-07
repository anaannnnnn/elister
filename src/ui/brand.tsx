import Image from "next/image";
import type { ReactNode } from "react";
import { cn } from "@/ui/kit";

export const BRAND = {
  name: "Elister Med",
  nameAr: "اليستر ميد",
  tagline: "Your Trusted Family Healthcare Partner in Dubai",
  taglineAr: "شريكك الموثوق لرعاية أسرتك في دبي",
  website: "www.elistermed.ae",
  email: "info@elistermed.ae",
  phones: ["+971 54 232 0542", "+971 4 283 8398"],
  address: "Al Noor Building, Al Qusais Industrial Area 3, Al Qusais, Dubai",
} as const;

/** Full-colour logo for light surfaces. */
export function Logo({ className, priority }: { className?: string; priority?: boolean }) {
  return <Image src="/brand/logo-footer.png" alt="Elister Med" width={235} height={117} priority={priority} className={cn("h-10 w-auto dark:hidden", className)} />;
}
/** White logo for dark/brand surfaces. In dark theme the full-colour logo is also swapped for this one. */
export function LogoWhite({ className, priority }: { className?: string; priority?: boolean }) {
  return <Image src="/brand/logo-header.png" alt="Elister Med" width={227} height={109} priority={priority} className={cn("h-10 w-auto", className)} />;
}
/** Picks the right variant for the current theme on a page background. */
export function LogoAuto({ className, priority }: { className?: string; priority?: boolean }) {
  return (
    <>
      <Logo className={className} priority={priority} />
      <LogoWhite className={cn("hidden dark:block", className)} priority={priority} />
    </>
  );
}
/** Leaf mark only (collapsed sidebar, avatars). */
export function Mark({ className, size = 32 }: { className?: string; size?: number }) {
  return <Image src="/brand/mark.png" alt="Elister Med" width={size} height={size} className={className} />;
}

/** Brand banner for module landing pages: white logo on the Elister gradient with the clinic's tagline. */
export function BrandBanner({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <div className="hero-grad relative mb-5 overflow-hidden rounded-[26px] border border-white/25 p-6 text-white shadow-[inset_0_1px_0_rgba(255,255,255,.35),0_28px_50px_-26px_rgba(6,51,90,.7)] sm:p-7">
      <div aria-hidden className="float-slow pointer-events-none absolute -end-12 -top-24 size-64 rounded-full bg-white/15 blur-2xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-20 start-1/3 size-56 rounded-full bg-cyan-200/25 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute end-28 top-1/2 size-40 -translate-y-1/2 rounded-full border border-white/25 bg-white/5 backdrop-blur-[2px]" />
      <div aria-hidden className="pointer-events-none absolute end-12 top-1/2 size-64 -translate-y-1/2 rounded-full border border-white/10" />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_0%_0%,rgba(255,255,255,.22),transparent_55%)]" />
      <Image src="/brand/mark.png" alt="" aria-hidden width={210} height={210} className="pointer-events-none absolute -end-4 top-1/2 size-44 -translate-y-1/2 opacity-[0.12]" />
      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && <div className="mb-2 inline-flex rounded-full border border-white/25 bg-white/15 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-white backdrop-blur">{eyebrow}</div>}
          <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-white">{title}</h1>
          <p className="mt-1 text-sm text-white/80">{BRAND.tagline}</p>
        </div>
        <Image src="/brand/logo-header.png" alt="Elister Med" width={227} height={109} className="h-12 w-auto" />
      </div>
      {children && <div className="relative mt-4 flex max-w-3xl flex-wrap gap-3">{children}</div>}
    </div>
  );
}
