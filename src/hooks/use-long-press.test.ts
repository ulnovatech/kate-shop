import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useLongPress } from "@/hooks/use-long-press";

describe("useLongPress", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("fires after the configured delay", () => {
    const onLongPress = vi.fn();
    const { result } = renderHook(() => useLongPress(onLongPress, { delayMs: 2000 }));

    act(() => {
      result.current.onPointerDown({
        button: 0,
        clientX: 10,
        clientY: 20,
      } as React.PointerEvent);
    });

    act(() => {
      vi.advanceTimersByTime(1999);
    });
    expect(onLongPress).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onLongPress).toHaveBeenCalledTimes(1);
    expect(onLongPress).toHaveBeenCalledWith(expect.objectContaining({ clientX: 10, clientY: 20 }));
  });

  it("cancels when the pointer moves too far", () => {
    const onLongPress = vi.fn();
    const { result } = renderHook(() =>
      useLongPress(onLongPress, { delayMs: 500, moveThreshold: 8 }),
    );

    act(() => {
      result.current.onPointerDown({
        button: 0,
        clientX: 0,
        clientY: 0,
      } as React.PointerEvent);
    });

    act(() => {
      result.current.onPointerMove({
        clientX: 20,
        clientY: 0,
      } as React.PointerEvent);
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(onLongPress).not.toHaveBeenCalled();
  });

  it("cancels on pointer up before the delay", () => {
    const onLongPress = vi.fn();
    const { result } = renderHook(() => useLongPress(onLongPress, { delayMs: 450 }));

    act(() => {
      result.current.onPointerDown({
        button: 0,
        clientX: 0,
        clientY: 0,
      } as React.PointerEvent);
      result.current.onPointerUp({} as React.PointerEvent);
    });

    act(() => {
      vi.advanceTimersByTime(450);
    });

    expect(onLongPress).not.toHaveBeenCalled();
  });

  it("ignores non-primary buttons", () => {
    const onLongPress = vi.fn();
    const { result } = renderHook(() => useLongPress(onLongPress, { delayMs: 100 }));

    act(() => {
      result.current.onPointerDown({
        button: 2,
        clientX: 0,
        clientY: 0,
      } as React.PointerEvent);
      vi.advanceTimersByTime(100);
    });

    expect(onLongPress).not.toHaveBeenCalled();
  });
});
