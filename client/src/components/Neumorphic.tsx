import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { ReactNode, useRef } from "react";

/* ============ NeumorphicCard — 3D tilt card with soft shadows ============ */

export function NeumorphicCard({
  children,
  className,
  pressed = false,
  tilt = true,
  animate = true,
  delay = 0,
  ...props
}: {
  children: ReactNode;
  className?: string;
  pressed?: boolean;
  tilt?: boolean;
  animate?: boolean;
  delay?: number;
  [key: string]: unknown;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!tilt || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    ref.current.style.transform = `perspective(900px) rotateX(${y * -6}deg) rotateY(${x * 6}deg) translateZ(0)`;
  };
  const onLeave = () => {
    if (ref.current) ref.current.style.transform = "perspective(900px) rotateX(0) rotateY(0) translateZ(0)";
  };

  const content = (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={cn(pressed ? "neu-pressed" : "neu", "overflow-hidden rounded-3xl transition-transform duration-200", className)}
      {...props}
    >
      {children}
    </div>
  );

  if (!animate) return content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, delay, ease: [0.23, 1, 0.32, 1] }}
    >
      {content}
    </motion.div>
  );
}

/* ============ FreshnessBadge — LIVE / CACHED / INFERRED / STALE labels ============ */

export type Freshness = "LIVE" | "CACHED" | "INFERRED" | "STALE" | "UNAVAILABLE";

const BADGE_STYLES: Record<Freshness, string> = {
  LIVE: "surface-sage",
  CACHED: "surface-lavender",
  INFERRED: "surface-peach",
  STALE: "surface-peach opacity-80",
  UNAVAILABLE: "neu-pressed",
};

export function FreshnessBadge({ value, className }: { value: Freshness; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-display text-[10px] font-semibold tracking-widest", BADGE_STYLES[value], className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", {
        "animate-pulse-slow bg-primary": value === "LIVE",
        "bg-lavender": value === "CACHED",
        "bg-peach": value === "INFERRED",
        "bg-warning": value === "STALE",
        "bg-muted-foreground": value === "UNAVAILABLE",
      })} />
      {value}
    </span>
  );
}

/* ============ Section — page shell with motion entrance ============ */

export function MotionPage({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="page"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/* ============ Stat chip ============ */

export function StatChip({ label, value, accent, sub }: { label: string; value: string; accent?: "cyan" | "gold" | "green"; sub?: string }) {
  const accentCls =
    accent === "gold" ? "text-peach" : accent === "green" ? "text-primary" : "text-primary";
  return (
    <div className="flex flex-col">
      <span className="font-display text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      <span className={`font-display text-2xl font-bold ${accentCls}`}>{value}</span>
      {sub ? <span className="font-ui text-xs text-muted-foreground">{sub}</span> : null}
    </div>
  );
}
