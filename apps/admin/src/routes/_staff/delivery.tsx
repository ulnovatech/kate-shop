import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, ChevronUp, ChevronDown, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { formatKES } from "@/lib/shop";
import { loadAdminDeliveryConfig } from "@/lib/delivery";
import { ADMIN_SETUP_COMPLETION_QUERY_KEY } from "@/lib/admin-setup-completion";
import { SettingsHubShell } from "@/components/admin/settings";
import { adminFullWidthMobile, adminIconTouch, adminPrimaryTouch } from "@/lib/admin-mobile";
import { humanizeError } from "@/lib/errors";
import { AdminFormSectionsSkeleton } from "@/components/loading-states";

export const Route = createFileRoute("/_staff/delivery")({
  staticData: { adminPermission: "settings" as const },
  component: AdminDelivery,
});

function AdminDelivery() {
  const qc = useQueryClient();
  const [newArea, setNewArea] = useState<Record<string, string>>({});

  const { data: config, isLoading } = useQuery({
    queryKey: ["admin-delivery"],
    queryFn: loadAdminDeliveryConfig,
    placeholderData: (previous) => previous,
  });

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["admin-delivery"] });
    void qc.invalidateQueries({ queryKey: ["delivery-config"] });
    void qc.invalidateQueries({ queryKey: ADMIN_SETUP_COMPLETION_QUERY_KEY });
  };

  const saveRules = useMutation({
    mutationFn: async (values: {
      express_delivery_fee: number;
      cod_fee: number;
      free_delivery_zones_1_2_threshold: number;
      free_delivery_all_zones_threshold: number;
    }) => supabase.from("delivery_rules").update(values).eq("id", 1),
    onSuccess: () => {
      toast.success("Rules saved");
      invalidate();
    },
    onError: (e: unknown) => toast.error(humanizeError(e, { fallback: "Could not save rules." })),
  });

  const saveZone = useMutation({
    mutationFn: async (z: {
      id: string;
      name: string;
      fee: number;
      description: string;
      is_active: boolean;
      free_delivery_threshold: string;
    }) =>
      supabase
        .from("delivery_zones")
        .update({
          name: z.name,
          fee: z.fee,
          description: z.description,
          is_active: z.is_active,
          free_delivery_threshold: z.free_delivery_threshold
            ? Number(z.free_delivery_threshold)
            : null,
        })
        .eq("id", z.id),
    onSuccess: () => {
      toast.success("Zone updated");
      invalidate();
    },
    onError: (e: unknown) => toast.error(humanizeError(e, { fallback: "Could not update zone." })),
  });

  const reorderZone = useMutation({
    mutationFn: async ({ id, dir }: { id: string; dir: -1 | 1 }) => {
      const zones = config?.zones ?? [];
      const idx = zones.findIndex((z) => z.id === id);
      const swap = idx + dir;
      if (idx < 0 || swap < 0 || swap >= zones.length) return;
      const a = zones[idx];
      const b = zones[swap];
      await Promise.all([
        supabase.from("delivery_zones").update({ sort_order: b.sort_order }).eq("id", a.id),
        supabase.from("delivery_zones").update({ sort_order: a.sort_order }).eq("id", b.id),
      ]);
    },
    onSuccess: () => invalidate(),
  });

  const addArea = useMutation({
    mutationFn: async ({ zoneId, name }: { zoneId: string; name: string }) => {
      const zone = config?.zones.find((z) => z.id === zoneId);
      const sort = zone?.delivery_zone_areas.length ?? 0;
      return supabase.from("delivery_zone_areas").insert({
        zone_id: zoneId,
        area_name: name,
        sort_order: sort,
      });
    },
    onSuccess: (_, vars) => {
      setNewArea((s) => ({ ...s, [vars.zoneId]: "" }));
      toast.success("Area added");
      invalidate();
    },
    onError: (e: unknown) => toast.error(humanizeError(e, { fallback: "Could not add area." })),
  });

  const deleteArea = useMutation({
    mutationFn: async (id: string) => supabase.from("delivery_zone_areas").delete().eq("id", id),
    onSuccess: () => {
      toast.success("Area removed");
      invalidate();
    },
    onError: (e: unknown) => toast.error(humanizeError(e, { fallback: "Could not remove area." })),
  });

  if (isLoading && !config) {
    return (
      <SettingsHubShell
        activeNav="delivery"
        title="Delivery"
        description="Kampala zones, areas, and fees. Changes apply to checkout immediately."
      >
        <AdminFormSectionsSkeleton sections={2} />
      </SettingsHubShell>
    );
  }

  if (!config) {
    return (
      <SettingsHubShell activeNav="delivery" title="Delivery">
        <p className="type-body-sm text-destructive" role="alert">
          Could not load delivery configuration.
        </p>
      </SettingsHubShell>
    );
  }

  const rules = config.rules;

  return (
    <SettingsHubShell
      activeNav="delivery"
      title="Delivery"
      description="Kampala zones, areas, and fees. Changes apply to checkout immediately — no deploy needed."
    >
      <form
        className="mt-8 max-w-2xl space-y-4 rounded-lg border bg-card p-6"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          saveRules.mutate({
            express_delivery_fee: Number(fd.get("express_delivery_fee")),
            cod_fee: Number(fd.get("cod_fee")),
            free_delivery_zones_1_2_threshold: Number(fd.get("free_delivery_zones_1_2_threshold")),
            free_delivery_all_zones_threshold: Number(fd.get("free_delivery_all_zones_threshold")),
          });
        }}
      >
        <h2 className="font-heading text-lg font-semibold">Global rules</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="express_delivery_fee">Express surcharge (UGX)</Label>
            <Input
              id="express_delivery_fee"
              name="express_delivery_fee"
              type="number"
              defaultValue={rules.express_delivery_fee}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="cod_fee">Cash on delivery fee (UGX)</Label>
            <Input
              id="cod_fee"
              name="cod_fee"
              type="number"
              defaultValue={rules.cod_fee}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="free_delivery_zones_1_2_threshold">
              Free delivery Zones 1–2 above (UGX)
            </Label>
            <Input
              id="free_delivery_zones_1_2_threshold"
              name="free_delivery_zones_1_2_threshold"
              type="number"
              defaultValue={rules.free_delivery_zones_1_2_threshold}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="free_delivery_all_zones_threshold">
              Free delivery all zones above (UGX)
            </Label>
            <Input
              id="free_delivery_all_zones_threshold"
              name="free_delivery_all_zones_threshold"
              type="number"
              defaultValue={rules.free_delivery_all_zones_threshold}
              className="mt-1.5"
            />
          </div>
        </div>
        <Button type="submit" disabled={saveRules.isPending} className={adminPrimaryTouch}>
          Save rules
        </Button>
      </form>

      <div className="mt-10 space-y-6">
        <h2 className="font-heading text-lg font-semibold">Zones &amp; areas</h2>
        {config.zones.map((zone, idx) => (
          <ZoneCard
            key={zone.id}
            zone={zone}
            index={idx}
            total={config.zones.length}
            newAreaValue={newArea[zone.id] ?? ""}
            onNewAreaChange={(v) => setNewArea((s) => ({ ...s, [zone.id]: v }))}
            onSave={(z) => saveZone.mutate(z)}
            onReorder={(dir) => reorderZone.mutate({ id: zone.id, dir })}
            onAddArea={(name) => addArea.mutate({ zoneId: zone.id, name })}
            onDeleteArea={(id) => deleteArea.mutate(id)}
          />
        ))}
      </div>
    </SettingsHubShell>
  );
}

function ZoneCard({
  zone,
  index,
  total,
  newAreaValue,
  onNewAreaChange,
  onSave,
  onReorder,
  onAddArea,
  onDeleteArea,
}: {
  zone: {
    id: string;
    zone_number: number;
    name: string;
    fee: number;
    description: string | null;
    is_active: boolean;
    free_delivery_threshold: number | null;
    delivery_zone_areas: { id: string; area_name: string }[];
  };
  index: number;
  total: number;
  newAreaValue: string;
  onNewAreaChange: (v: string) => void;
  onSave: (z: {
    id: string;
    name: string;
    fee: number;
    description: string;
    is_active: boolean;
    free_delivery_threshold: string;
  }) => void;
  onReorder: (dir: -1 | 1) => void;
  onAddArea: (name: string) => void;
  onDeleteArea: (id: string) => void;
}) {
  const [name, setName] = useState(zone.name);
  const [fee, setFee] = useState(String(zone.fee));
  const [description, setDescription] = useState(zone.description ?? "");
  const [active, setActive] = useState(zone.is_active);
  const [zoneFree, setZoneFree] = useState(
    zone.free_delivery_threshold != null ? String(zone.free_delivery_threshold) : "",
  );

  return (
    <div className={`rounded-lg border bg-card p-5 ${!active ? "opacity-60" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Zone {zone.zone_number} · {formatKES(Number(fee))}
          </p>
          <p className="font-heading text-lg font-semibold">{name}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            className={adminIconTouch}
            disabled={index === 0}
            onClick={() => onReorder(-1)}
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className={adminIconTouch}
            disabled={index === total - 1}
            onClick={() => onReorder(1)}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
          <div className="flex min-h-11 items-center gap-2 pl-2">
            <Switch checked={active} onCheckedChange={setActive} />
            <span className="text-xs text-muted-foreground">{active ? "Active" : "Disabled"}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <Label>Zone name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label>Fee (UGX)</Label>
          <Input
            type="number"
            value={fee}
            onChange={(e) => setFee(e.target.value)}
            className="mt-1"
          />
        </div>
        <div className="sm:col-span-2">
          <Label>Description</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="mt-1"
          />
        </div>
        <div>
          <Label>Zone free-delivery threshold (optional UGX)</Label>
          <Input
            type="number"
            value={zoneFree}
            onChange={(e) => setZoneFree(e.target.value)}
            placeholder="Uses global Zones 1–2 rule if empty"
            className="mt-1"
          />
        </div>
      </div>

      <Button
        className={`mt-4 ${adminPrimaryTouch} ${adminFullWidthMobile}`}
        onClick={() =>
          onSave({
            id: zone.id,
            name,
            fee: Number(fee),
            description,
            is_active: active,
            free_delivery_threshold: zoneFree,
          })
        }
      >
        Save zone
      </Button>

      <div className="mt-6">
        <Label>Areas ({zone.delivery_zone_areas.length})</Label>
        <ul className="mt-2 flex flex-wrap gap-2">
          {zone.delivery_zone_areas.map((a) => (
            <li
              key={a.id}
              className="flex items-center gap-1 rounded-full border px-3 py-1 text-xs"
            >
              {a.area_name}
              <button
                type="button"
                onClick={() => onDeleteArea(a.id)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-destructive"
                aria-label={`Remove ${a.area_name}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
        <form
          className="mt-3 flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            const n = newAreaValue.trim();
            if (n) onAddArea(n);
          }}
        >
          <Input
            value={newAreaValue}
            onChange={(e) => onNewAreaChange(e.target.value)}
            placeholder="New area name"
            className="w-full sm:max-w-xs"
          />
          <Button type="submit" variant="outline" className={adminPrimaryTouch}>
            <Plus className="mr-1 h-4 w-4" /> Add
          </Button>
        </form>
      </div>
    </div>
  );
}
