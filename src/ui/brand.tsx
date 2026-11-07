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
    <div className="hero-grad page-in relative mb-5 overflow-hidden rounded-[28px] p-6 text-white shadow-[var(--shadow-pop)] sm:p-8">
      <div aria-hidden className="float-slow pointer-events-none absolute -end-10 -top-20 size-64 rounded-full bg-white/15 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-24 start-1/4 size-64 rounded-full bg-[#fadbca]/25 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute end-24 top-1/2 size-44 -translate-y-1/2 rounded-full border border-white/20" />
      <div aria-hidden className="pointer-events-none absolute end-14 top-1/2 size-72 -translate-y-1/2 rounded-full border border-white/10" />
      <Image src="/brand/mark.png" alt="" aria-hidden width={210} height={210} className="pointer-events-none absolute -end-6 top-1/2 size-48 -translate-y-1/2 opacity-[0.12]" />
      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && <div className="mb-2 inline-flex rounded-full bg-white/15 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-white ring-1 ring-white/20 backdrop-blur">{eyebrow}</div>}
          <h1 className="text-[28px] font-medium leading-tight tracking-tight text-white">{title}</h1>
          <p className="mt-1.5 text-sm font-light text-white/80">{BRAND.tagline}</p>
        </div>
        <Image src="/brand/logo-header.png" alt="Elister Med" width={227} height={109} className="h-12 w-auto opacity-95" />
      </div>
      {children && <div className="relative mt-4 flex max-w-3xl flex-wrap gap-3 font-light">{children}</div>}
    </div>
  );
}
