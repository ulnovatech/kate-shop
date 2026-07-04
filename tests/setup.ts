import { vi } from "vitest";
import "@testing-library/jest-dom/vitest";

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal("ResizeObserver", ResizeObserverStub);

if (!document.elementFromPoint) {
  document.elementFromPoint = () => null;
}
