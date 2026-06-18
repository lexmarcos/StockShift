import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useFooterVisibility } from "./use-footer-visibility";

type ScrollMetrics = {
  scrollY: number;
  scrollHeight: number;
  innerHeight: number;
};

const setScrollMetrics = ({ scrollY, scrollHeight, innerHeight }: ScrollMetrics): void => {
  Object.defineProperty(window, "scrollY", {
    configurable: true,
    value: scrollY,
  });
  Object.defineProperty(window, "innerHeight", {
    configurable: true,
    value: innerHeight,
  });
  Object.defineProperty(document.documentElement, "scrollHeight", {
    configurable: true,
    value: scrollHeight,
  });
};

const fireScroll = (): void => {
  act(() => {
    window.dispatchEvent(new Event("scroll"));
  });
};

const resetScrollMetrics = (): void => {
  setScrollMetrics({ scrollY: 0, scrollHeight: 0, innerHeight: 0 });
};

describe("useFooterVisibility", () => {
  beforeEach(() => {
    resetScrollMetrics();
  });

  afterEach(() => {
    resetScrollMetrics();
    vi.restoreAllMocks();
  });

  it("inicia visível por padrão em página curta", () => {
    const { result } = renderHook(() => useFooterVisibility());
    expect(result.current.isFooterVisible).toBe(true);
  });

  it("mantém initialVisible false em página longa antes de qualquer scroll", () => {
    setScrollMetrics({ scrollY: 300, scrollHeight: 1000, innerHeight: 200 });
    const { result } = renderHook(() =>
      useFooterVisibility({ initialVisible: false }),
    );
    expect(result.current.isFooterVisible).toBe(false);
  });

  it("oculta footer ao rolar para baixo no meio da página", () => {
    setScrollMetrics({ scrollY: 0, scrollHeight: 1000, innerHeight: 200 });
    const { result } = renderHook(() => useFooterVisibility());

    fireScroll();
    expect(result.current.isFooterVisible).toBe(true);

    setScrollMetrics({ scrollY: 300, scrollHeight: 1000, innerHeight: 200 });
    fireScroll();
    expect(result.current.isFooterVisible).toBe(false);
  });

  it("mostra footer ao rolar para cima no meio da página", () => {
    setScrollMetrics({ scrollY: 300, scrollHeight: 1000, innerHeight: 200 });
    const { result } = renderHook(() => useFooterVisibility());

    fireScroll();
    expect(result.current.isFooterVisible).toBe(false);

    setScrollMetrics({ scrollY: 200, scrollHeight: 1000, innerHeight: 200 });
    fireScroll();
    expect(result.current.isFooterVisible).toBe(true);
  });

  it("mostra footer ao atingir o fim da página", () => {
    setScrollMetrics({ scrollY: 400, scrollHeight: 1000, innerHeight: 200 });
    const { result } = renderHook(() => useFooterVisibility());

    fireScroll();
    expect(result.current.isFooterVisible).toBe(false);

    setScrollMetrics({ scrollY: 795, scrollHeight: 1000, innerHeight: 200 });
    fireScroll();
    expect(result.current.isFooterVisible).toBe(true);
  });

  it("preserva estado em micro-rolagens abaixo do limiar", () => {
    setScrollMetrics({ scrollY: 500, scrollHeight: 1000, innerHeight: 200 });
    const { result } = renderHook(() => useFooterVisibility());

    fireScroll();
    const estadoAposPrimeiraLeitura = result.current.isFooterVisible;

    setScrollMetrics({ scrollY: 503, scrollHeight: 1000, innerHeight: 200 });
    fireScroll();
    expect(result.current.isFooterVisible).toBe(estadoAposPrimeiraLeitura);

    setScrollMetrics({ scrollY: 499, scrollHeight: 1000, innerHeight: 200 });
    fireScroll();
    expect(result.current.isFooterVisible).toBe(estadoAposPrimeiraLeitura);
  });

  it("remove listener de scroll ao desmontar", () => {
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() => useFooterVisibility());

    unmount();
    expect(removeSpy).toHaveBeenCalledWith("scroll", expect.any(Function));
  });
});
