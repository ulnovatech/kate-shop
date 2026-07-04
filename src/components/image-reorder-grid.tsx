import { useState, type DragEvent, type ReactNode } from "react";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

type ImageReorderGridProps<T> = {
  items: T[];
  onReorder: (items: T[]) => void;
  keyFn: (item: T, index: number) => string;
  renderItem: (item: T, index: number) => ReactNode;
  className?: string;
};

export function ImageReorderGrid<T>({
  items,
  onReorder,
  keyFn,
  renderItem,
  className,
}: ImageReorderGridProps<T>) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const onDragStart = (index: number) => (e: DragEvent) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  };

  const onDragOver = (index: number) => (e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragIndex !== null && dragIndex !== index) {
      const next = [...items];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(index, 0, moved);
      setDragIndex(index);
      onReorder(next);
    }
  };

  const onDragEnd = () => setDragIndex(null);

  return (
    <div className={cn("space-y-3", className)}>
      {items.map((item, index) => (
        <div
          key={keyFn(item, index)}
          draggable
          onDragStart={onDragStart(index)}
          onDragOver={onDragOver(index)}
          onDragEnd={onDragEnd}
          className={cn(
            "flex gap-3 rounded-md border bg-card p-3 transition-shadow",
            dragIndex === index && "ring-2 ring-gold/50",
          )}
        >
          <div
            className="flex shrink-0 cursor-grab items-center text-muted-foreground active:cursor-grabbing"
            aria-hidden
          >
            <GripVertical className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">{renderItem(item, index)}</div>
        </div>
      ))}
      <p className="text-xs text-muted-foreground">
        Drag to reorder. First photo is the cover image.
      </p>
    </div>
  );
}
