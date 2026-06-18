import { describe, expect, it } from "vitest";
import { shouldShowFooter, FOOTER_SCROLL_THRESHOLD } from "./should-show-footer";

describe("shouldShowFooter", () => {
  it("mostra footer em página curta sem espaço para rolar", () => {
    expect(
      shouldShowFooter({
        currentScrollY: 0,
        lastScrollY: 0,
        maxScrollY: 0,
      }),
    ).toBe(true);
    expect(
      shouldShowFooter({
        currentScrollY: 4,
        lastScrollY: 2,
        maxScrollY: FOOTER_SCROLL_THRESHOLD,
      }),
    ).toBe(true);
  });

  it("mostra footer no fim da página mesmo rolando para baixo", () => {
    expect(
      shouldShowFooter({
        currentScrollY: 995,
        lastScrollY: 900,
        maxScrollY: 1000,
      }),
    ).toBe(true);
  });

  it("mostra footer no topo de página longa", () => {
    expect(
      shouldShowFooter({
        currentScrollY: 4,
        lastScrollY: 50,
        maxScrollY: 1000,
      }),
    ).toBe(true);
  });

  it("oculta footer rolando para baixo no meio da página", () => {
    expect(
      shouldShowFooter({
        currentScrollY: 200,
        lastScrollY: 100,
        maxScrollY: 1000,
      }),
    ).toBe(false);
  });

  it("mostra footer rolando para cima no meio da página", () => {
    expect(
      shouldShowFooter({
        currentScrollY: 600,
        lastScrollY: 700,
        maxScrollY: 1000,
      }),
    ).toBe(true);
  });

  it("preserva estado anterior em micro-rolagens abaixo do limiar", () => {
    expect(
      shouldShowFooter({
        currentScrollY: 500,
        lastScrollY: 502,
        maxScrollY: 1000,
        previousVisible: false,
      }),
    ).toBe(false);
    expect(
      shouldShowFooter({
        currentScrollY: 500,
        lastScrollY: 498,
        maxScrollY: 1000,
        previousVisible: true,
      }),
    ).toBe(true);
    expect(
      shouldShowFooter({
        currentScrollY: 500,
        lastScrollY: 506,
        maxScrollY: 1000,
        previousVisible: true,
      }),
    ).toBe(true);
    expect(
      shouldShowFooter({
        currentScrollY: 500,
        lastScrollY: 494,
        maxScrollY: 1000,
        previousVisible: false,
      }),
    ).toBe(false);
  });

  it("respeita limiar customizado quando fornecido", () => {
    expect(
      shouldShowFooter({
        currentScrollY: 515,
        lastScrollY: 500,
        maxScrollY: 1000,
        previousVisible: true,
        scrollThreshold: 20,
      }),
    ).toBe(true);
    expect(
      shouldShowFooter({
        currentScrollY: 525,
        lastScrollY: 500,
        maxScrollY: 1000,
        previousVisible: true,
        scrollThreshold: 20,
      }),
    ).toBe(false);
    expect(
      shouldShowFooter({
        currentScrollY: 500,
        lastScrollY: 525,
        maxScrollY: 1000,
        previousVisible: false,
        scrollThreshold: 20,
      }),
    ).toBe(true);
  });
});
