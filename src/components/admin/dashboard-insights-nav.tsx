import { cn } from "@/lib/utils";

export type DashboardInsightsSection = {
  id: string;
  label: string;
};

const DEFAULT_SECTIONS: DashboardInsightsSection[] = [
  { id: "revenue", label: "Revenue" },
  { id: "orders", label: "Orders" },
  { id: "customers", label: "Customers" },
];

export function dashboardInsightsSections(showCatalog: boolean): DashboardInsightsSection[] {
  if (!showCatalog) return DEFAULT_SECTIONS;
  return [...DEFAULT_SECTIONS, { id: "inventory", label: "Inventory" }];
}

export function DashboardInsightsNav({
  sections,
  className,
}: {
  sections: DashboardInsightsSection[];
  className?: string;
}) {
  return (
    <nav aria-label="Insights sections" className={cn("flex flex-wrap gap-2", className)}>
      {sections.map((section) => (
        <a
          key={section.id}
          href={`#${section.id}`}
          className="rounded-full border bg-card px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
        >
          {section.label}
        </a>
      ))}
    </nav>
  );
}
