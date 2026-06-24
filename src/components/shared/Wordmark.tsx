import { cn } from "@/lib/utils";

/**
 * The "PURO" blackletter wordmark (Pirata One). Used in the nav, the mobile
 * drawer, and the footer — never for body copy or buttons.
 */
export default function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-wordmark leading-none tracking-[0.02em]", className)}>PURO</span>
  );
}
