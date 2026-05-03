import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  isStockMovementReloadShortcut,
  useStockMovementReloadGuardModel,
} from "./stock-movement-reload-guard.model";

const createKeyboardEvent = (
  key: string,
  options: KeyboardEventInit = {},
): KeyboardEvent => {
  return new KeyboardEvent("keydown", {
    key,
    bubbles: true,
    cancelable: true,
    ...options,
  });
};

const createBeforeUnloadEvent = (): BeforeUnloadEvent => {
  return new Event("beforeunload", {
    cancelable: true,
  }) as BeforeUnloadEvent;
};

describe("isStockMovementReloadShortcut", () => {
  it("identifica atalhos de recarregar a pagina", () => {
    expect(isStockMovementReloadShortcut(createKeyboardEvent("F5"))).toBe(true);
    expect(
      isStockMovementReloadShortcut(createKeyboardEvent("r", { ctrlKey: true })),
    ).toBe(true);
    expect(
      isStockMovementReloadShortcut(createKeyboardEvent("R", { metaKey: true })),
    ).toBe(true);
  });

  it("ignora teclas que nao recarregam a pagina", () => {
    expect(isStockMovementReloadShortcut(createKeyboardEvent("Escape"))).toBe(
      false,
    );
    expect(isStockMovementReloadShortcut(createKeyboardEvent("r"))).toBe(false);
  });
});

describe("useStockMovementReloadGuardModel", () => {
  it("abre confirmacao propria ao usar atalho de reload", () => {
    const reloadPage = vi.fn();
    const { result, unmount } = renderHook(() =>
      useStockMovementReloadGuardModel({ reloadPage }),
    );
    const event = createKeyboardEvent("F5");

    act(() => {
      window.dispatchEvent(event);
    });

    expect(event.defaultPrevented).toBe(true);
    expect(result.current.isConfirmOpen).toBe(true);
    expect(reloadPage).not.toHaveBeenCalled();

    act(() => {
      result.current.onCancelReload();
    });

    expect(result.current.isConfirmOpen).toBe(false);
    unmount();
  });

  it("usa prompt nativo do navegador para reload fora do atalho", () => {
    const { unmount } = renderHook(() => useStockMovementReloadGuardModel());
    const event = createBeforeUnloadEvent();

    act(() => {
      window.dispatchEvent(event);
    });

    expect(event.defaultPrevented).toBe(true);
    unmount();
  });

  it("recarrega sem novo bloqueio depois da confirmacao", () => {
    const reloadPage = vi.fn();
    const { result, unmount } = renderHook(() =>
      useStockMovementReloadGuardModel({ reloadPage }),
    );

    act(() => {
      result.current.onConfirmReload();
    });

    const event = createBeforeUnloadEvent();
    act(() => {
      window.dispatchEvent(event);
    });

    expect(reloadPage).toHaveBeenCalledTimes(1);
    expect(result.current.isConfirmOpen).toBe(false);
    expect(event.defaultPrevented).toBe(false);
    unmount();
  });

  it("nao bloqueia recarregamento quando esta desabilitado", () => {
    const reloadPage = vi.fn();
    const { result, unmount } = renderHook(() =>
      useStockMovementReloadGuardModel({ isEnabled: false, reloadPage }),
    );
    const keyEvent = createKeyboardEvent("F5");
    const unloadEvent = createBeforeUnloadEvent();

    act(() => {
      window.dispatchEvent(keyEvent);
      window.dispatchEvent(unloadEvent);
    });

    expect(keyEvent.defaultPrevented).toBe(false);
    expect(unloadEvent.defaultPrevented).toBe(false);
    expect(result.current.isConfirmOpen).toBe(false);
    expect(reloadPage).not.toHaveBeenCalled();
    unmount();
  });
});
