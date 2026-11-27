import { describe, expect, it, vi } from "vitest";

vi.mock("three", async (orig) => {
  const actual = await orig<typeof import("three")>();
  return {
    ...actual,
    WebGLRenderer: class {
      constructor() {
        throw new Error("no WebGL");
      }
    },
  };
});

import { createRenderer, defaultQuality } from "./renderer";

describe("defaultQuality", () => {
  it("is lite on touch, high otherwise", () => {
    expect(defaultQuality(true)).toBe("lite");
    expect(defaultQuality(false)).toBe("high");
  });
});

describe("createRenderer", () => {
  it("fails with a helpful message when WebGL throws", () => {
    const r = createRenderer({ appendChild() {} } as unknown as HTMLElement);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toContain("graphics acceleration");
  });
});
