import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type PinchZoomImageProps = {
  src: string;
  alt: string;
  className?: string;
};

/** Touch pinch-to-zoom for product gallery lightbox. */
export function PinchZoomImage({ src, alt, className }: PinchZoomImageProps) {
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchStart = useRef<{ distance: number; scale: number } | null>(null);
  const panStart = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);

  const distance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
    Math.hypot(a.x - b.x, a.y - b.y);

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2) {
      const pts = [...pointers.current.values()];
      pinchStart.current = { distance: distance(pts[0], pts[1]), scale };
      panStart.current = null;
    } else if (pointers.current.size === 1 && scale > 1) {
      panStart.current = { x: e.clientX, y: e.clientY, tx: translate.x, ty: translate.y };
      pinchStart.current = null;
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2 && pinchStart.current) {
      const pts = [...pointers.current.values()];
      const nextScale = Math.min(
        4,
        Math.max(1, (pinchStart.current.scale * distance(pts[0], pts[1])) / pinchStart.current.distance),
      );
      setScale(nextScale);
      if (nextScale <= 1) setTranslate({ x: 0, y: 0 });
    } else if (pointers.current.size === 1 && panStart.current && scale > 1) {
      setTranslate({
        x: panStart.current.tx + (e.clientX - panStart.current.x),
        y: panStart.current.ty + (e.clientY - panStart.current.y),
      });
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchStart.current = null;
    if (pointers.current.size === 0) panStart.current = null;
    if (scale <= 1.05) {
      setScale(1);
      setTranslate({ x: 0, y: 0 });
    }
  };

  const onDoubleClick = useCallback(() => {
    if (scale > 1) {
      setScale(1);
      setTranslate({ x: 0, y: 0 });
    } else {
      setScale(2);
    }
  }, [scale]);

  return (
    <img
      src={src}
      alt={alt}
      draggable={false}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDoubleClick={onDoubleClick}
      className={cn(
        "max-h-[75vh] w-full touch-none select-none object-contain transition-transform duration-75",
        className,
      )}
      style={{
        transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
      }}
    />
  );
}
