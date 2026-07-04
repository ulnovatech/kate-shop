import type { CSSProperties } from "react";
import { useMemo } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

const COLORS = ["bg-gold", "bg-primary", "bg-emerald-500", "bg-amber-400", "bg-rose-400"] as const;

type Particle = {
  id: number;
  left: string;
  delay: string;
  duration: string;
  color: (typeof COLORS)[number];
  size: string;
  rotate: string;
};

function buildParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, id) => ({
    id,
    left: `${8 + ((id * 17) % 84)}%`,
    delay: `${(id % 7) * 0.04}s`,
    duration: `${1.6 + (id % 5) * 0.15}s`,
    color: COLORS[id % COLORS.length],
    size: id % 3 === 0 ? "h-2.5 w-1.5" : "h-2 w-1",
    rotate: `${(id * 37) % 360}deg`,
  }));
}

type ConfettiBurstProps = {
  className?: string;
  /** Number of particles (default 36). */
  count?: number;
};

/** CK-10 — lightweight celebration burst; respects reduced motion. */
export function ConfettiBurst({ className, count = 36 }: ConfettiBurstProps) {
  const reduced = useReducedMotion();
  const particles = useMemo(() => buildParticles(count), [count]);

  if (reduced) return null;

  return (
    <div
      className={cn("pointer-events-none fixed inset-0 z-overlay overflow-hidden", className)}
      aria-hidden
    >
      {particles.map((p) => (
        <span
          key={p.id}
          className={cn("confetti-particle absolute top-0 rounded-sm opacity-90", p.size, p.color)}
          style={
            {
              left: p.left,
              animationDelay: p.delay,
              animationDuration: p.duration,
              transform: `rotate(${p.rotate})`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
