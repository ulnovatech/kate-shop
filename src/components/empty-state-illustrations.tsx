import { cn } from "@/lib/utils";

export type EmptyStateIllustrationId =
  | "cart"
  | "catalog"
  | "orders"
  | "search"
  | "audit"
  | "inbox";

type EmptyStateIllustrationProps = {
  id: EmptyStateIllustrationId;
  className?: string;
};

/** DS-07 — consistent decorative SVG set for empty states. */
export function EmptyStateIllustration({ id, className }: EmptyStateIllustrationProps) {
  const shared = cn("text-emerald-deep/80", className);

  switch (id) {
    case "cart":
      return (
        <svg viewBox="0 0 120 120" className={shared} aria-hidden>
          <circle cx="60" cy="60" r="54" className="fill-emerald-deep/8" />
          <path
            d="M34 42h52l-6 34H40L34 42Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path d="M42 42l6-14h24l6 14" fill="none" stroke="currentColor" strokeWidth="3" />
          <circle cx="48" cy="84" r="5" fill="currentColor" />
          <circle cx="74" cy="84" r="5" fill="currentColor" />
          <path
            d="M78 34c6 0 10 4 10 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.5"
          />
        </svg>
      );
    case "catalog":
      return (
        <svg viewBox="0 0 120 120" className={shared} aria-hidden>
          <circle cx="60" cy="60" r="54" className="fill-emerald-deep/8" />
          <rect x="34" y="36" width="52" height="40" rx="6" fill="none" stroke="currentColor" strokeWidth="3" />
          <path d="M34 52h52" stroke="currentColor" strokeWidth="2.5" opacity="0.45" />
          <rect x="42" y="60" width="18" height="8" rx="2" className="fill-gold/70" />
          <rect x="64" y="60" width="14" height="8" rx="2" fill="currentColor" opacity="0.25" />
          <path d="M44 84h32" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    case "orders":
      return (
        <svg viewBox="0 0 120 120" className={shared} aria-hidden>
          <circle cx="60" cy="60" r="54" className="fill-emerald-deep/8" />
          <rect x="38" y="30" width="44" height="58" rx="6" fill="none" stroke="currentColor" strokeWidth="3" />
          <path d="M48 44h24M48 56h18M48 68h22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="76" cy="78" r="12" className="fill-gold/80" />
          <path
            d="M71 78l3 3 6-7"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "search":
      return (
        <svg viewBox="0 0 120 120" className={shared} aria-hidden>
          <circle cx="60" cy="60" r="54" className="fill-emerald-deep/8" />
          <circle cx="54" cy="54" r="18" fill="none" stroke="currentColor" strokeWidth="3" />
          <path d="M68 68l16 16" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <path
            d="M46 54h16M54 46v16"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.35"
          />
        </svg>
      );
    case "audit":
      return (
        <svg viewBox="0 0 120 120" className={shared} aria-hidden>
          <circle cx="60" cy="60" r="54" className="fill-emerald-deep/8" />
          <path
            d="M40 34h40v52H40V34Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path d="M48 48h24M48 60h20M48 72h16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="78" cy="78" r="14" className="fill-gold/75" />
          <path
            d="M73 78l3 3 7-8"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case "inbox":
      return (
        <svg viewBox="0 0 120 120" className={shared} aria-hidden>
          <circle cx="60" cy="60" r="54" className="fill-emerald-deep/8" />
          <path
            d="M30 42h60v36H30V42Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path d="M30 48l30 20 30-20" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
          <circle cx="82" cy="38" r="8" className="fill-gold/85" />
        </svg>
      );
    default:
      return null;
  }
}
