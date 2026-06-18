import { afterEach, describe, expect, it, vi } from "vitest";
import {
  findFirstInvalidField,
  scrollToFieldById,
  scrollToFirstInvalidField,
} from "./scroll-to-first-invalid-field";

const rectAt = (top: number, height = 40): DOMRect =>
  ({
    top,
    bottom: top + height,
    height,
    left: 0,
    right: 0,
    width: 0,
    x: 0,
    y: top,
    toJSON: () => ({}),
  }) as DOMRect;

// jsdom's default viewport height is 768px.
const OFFSCREEN_RECT = rectAt(2000);
const VISIBLE_RECT = rectAt(100);

const buildField = (
  id: string,
  invalid: boolean,
  rect: DOMRect = OFFSCREEN_RECT,
): HTMLInputElement => {
  const input = document.createElement("input");
  input.id = id;
  if (invalid) input.setAttribute("aria-invalid", "true");
  input.getBoundingClientRect = () => rect;
  document.body.appendChild(input);
  return input;
};

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("findFirstInvalidField", () => {
  it("returns the topmost field flagged aria-invalid", () => {
    buildField("name", false);
    const quantity = buildField("quantity", true);
    buildField("price", true);

    expect(findFirstInvalidField()).toBe(quantity);
  });

  it("returns null when no field is invalid", () => {
    buildField("name", false);

    expect(findFirstInvalidField()).toBeNull();
  });
});

describe("scrollToFirstInvalidField", () => {
  it("centers the first off-screen invalid field in the viewport", () => {
    buildField("name", false);
    const quantity = buildField("quantity", true);
    const scrollIntoView = vi.fn();
    quantity.scrollIntoView = scrollIntoView;

    scrollToFirstInvalidField();

    expect(scrollIntoView).toHaveBeenCalledWith({
      block: "center",
      behavior: "smooth",
    });
  });

  it("leaves an already fully visible invalid field untouched", () => {
    const quantity = buildField("quantity", true, VISIBLE_RECT);
    const scrollIntoView = vi.fn();
    quantity.scrollIntoView = scrollIntoView;

    scrollToFirstInvalidField();

    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("does nothing when there is no invalid field", () => {
    const valid = buildField("name", false);
    const scrollIntoView = vi.fn();
    valid.scrollIntoView = scrollIntoView;

    scrollToFirstInvalidField();

    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});

describe("scrollToFieldById", () => {
  it("centers the off-screen field with the matching id", () => {
    buildField("attr-key-0", false);
    const target = buildField("attr-value-1", false);
    const scrollIntoView = vi.fn();
    target.scrollIntoView = scrollIntoView;

    scrollToFieldById("attr-value-1");

    expect(scrollIntoView).toHaveBeenCalledWith({
      block: "center",
      behavior: "smooth",
    });
  });

  it("leaves an already fully visible field untouched", () => {
    const target = buildField("attr-value-1", false, VISIBLE_RECT);
    const scrollIntoView = vi.fn();
    target.scrollIntoView = scrollIntoView;

    scrollToFieldById("attr-value-1");

    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("does nothing when no field matches the id", () => {
    const field = buildField("attr-key-0", false);
    const scrollIntoView = vi.fn();
    field.scrollIntoView = scrollIntoView;

    scrollToFieldById("attr-key-9");

    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});
