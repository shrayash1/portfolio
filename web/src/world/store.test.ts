import { expect, it, vi } from "vitest";
import { store } from "./store";

it("notifies subscribers once with merged state, and not after unsubscribe", () => {
  const fn = vi.fn();
  const off = store.subscribe(fn);
  store.set({ prompt: "Talk" });
  expect(fn).toHaveBeenCalledTimes(1);
  expect(fn.mock.calls[0][0]).toMatchObject({ prompt: "Talk", objective: null, loading: false });
  off();
  store.set({ prompt: null });
  expect(fn).toHaveBeenCalledTimes(1);
});
