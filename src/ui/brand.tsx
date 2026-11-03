import Image from "next/image";
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
