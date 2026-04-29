import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isMobileMenuEdgeSwipeStart,
  isMobileMenuOpeningSwipe,
  useMobileMenuEdgeSwipe,
} from "./mobile-menu-edge-swipe";

const setViewportWidth = (width: number): void => {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: width,
  });
};

const dispatchTouch = (
  eventType: "touchstart" | "touchmove" | "touchend",
  x: number,
  y: number
): Event => {
  const event = new Event(eventType, { bubbles: true, cancelable: true });
  Object.defineProperty(event, "touches", {
    configurable: true,
    value:
      eventType === "touchend"
        ? []
        : ([{ clientX: x, clientY: y }] as unknown as TouchList),
  });

  window.dispatchEvent(event);
  return event;
};

afterEach(() => {
  cleanup();
  setViewportWidth(1024);
});

describe("mobile menu edge swipe", () => {
  it("starts only from the left edge on mobile while closed", () => {
    expect(isMobileMenuEdgeSwipeStart({ x: 12, y: 100 }, false, 390)).toBe(
      true
    );
    expect(isMobileMenuEdgeSwipeStart({ x: 40, y: 100 }, false, 390)).toBe(
      false
    );
    expect(isMobileMenuEdgeSwipeStart({ x: 12, y: 100 }, true, 390)).toBe(
      false
    );
    expect(isMobileMenuEdgeSwipeStart({ x: 12, y: 100 }, false, 1024)).toBe(
      false
    );
  });

  it("accepts a horizontal right swipe and rejects short or vertical drags", () => {
    expect(isMobileMenuOpeningSwipe({ x: 10, y: 50 }, { x: 92, y: 58 })).toBe(
      true
    );
    expect(isMobileMenuOpeningSwipe({ x: 10, y: 50 }, { x: 50, y: 54 })).toBe(
      false
    );
    expect(isMobileMenuOpeningSwipe({ x: 10, y: 50 }, { x: 96, y: 140 })).toBe(
      false
    );
  });

  it("opens the menu when the user swipes right from the left edge", () => {
    const openMenu = vi.fn();
    renderHook(() => useMobileMenuEdgeSwipe({ isOpen: false, openMenu }));
    setViewportWidth(390);

    act(() => {
      dispatchTouch("touchstart", 10, 120);
      dispatchTouch("touchmove", 92, 124);
    });

    expect(openMenu).toHaveBeenCalledTimes(1);
  });

  it("ignores right swipes that start away from the left edge", () => {
    const openMenu = vi.fn();
    renderHook(() => useMobileMenuEdgeSwipe({ isOpen: false, openMenu }));
    setViewportWidth(390);

    act(() => {
      dispatchTouch("touchstart", 56, 120);
      dispatchTouch("touchmove", 150, 124);
    });

    expect(openMenu).not.toHaveBeenCalled();
  });
});
