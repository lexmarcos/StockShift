import { describe, expect, it } from "vitest";
import {
  NEW_VERSION_MESSAGE,
  UPDATE_ACTION_LABEL,
  shouldRegisterServiceWorker,
} from "./service-worker-registration";

describe("shouldRegisterServiceWorker", () => {
  it("registers only in production when the API is available", () => {
    expect(shouldRegisterServiceWorker("production", true)).toBe(true);
  });

  it("does not register outside production", () => {
    expect(shouldRegisterServiceWorker("development", true)).toBe(false);
    expect(shouldRegisterServiceWorker("test", true)).toBe(false);
    expect(shouldRegisterServiceWorker(undefined, true)).toBe(false);
  });

  it("does not register when the browser lacks service worker support", () => {
    expect(shouldRegisterServiceWorker("production", false)).toBe(false);
  });
});

describe("update copy", () => {
  it("uses pt-BR strings", () => {
    expect(NEW_VERSION_MESSAGE).toBe("Nova versão disponível");
    expect(UPDATE_ACTION_LABEL).toBe("Atualizar");
  });
});
