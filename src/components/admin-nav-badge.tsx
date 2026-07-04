type AdminNavBadgeProps = {
  count: number;
  className?: string;
};

/** Gold count pill for admin nav icons (matches storefront cart badge). */
export function AdminNavBadge({ count, className = "" }: AdminNavBadgeProps) {
  if (count <= 0) return null;

  return (
    <span
      className={`absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-0.5 text-[10px] font-semibold text-gold-foreground ${className}`}
      aria-hidden
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}
