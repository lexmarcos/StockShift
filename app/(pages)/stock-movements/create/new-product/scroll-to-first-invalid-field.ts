const INVALID_FIELD_SELECTOR = '[aria-invalid="true"]';

/** Whether the field sits fully within the viewport's vertical bounds. */
const isFieldFullyVisible = (field: HTMLElement): boolean => {
  const { top, bottom } = field.getBoundingClientRect();
  const viewportHeight =
    window.innerHeight || document.documentElement.clientHeight;
  return top >= 0 && bottom <= viewportHeight;
};

/**
 * Centers a field in the viewport, but only when it is off-screen — a field
 * already fully visible is left untouched.
 */
const scrollFieldIntoView = (field: HTMLElement): void => {
  if (isFieldFullyVisible(field)) return;
  field.scrollIntoView({ block: "center", behavior: "smooth" });
};

/**
 * Finds the first form control flagged invalid by react-hook-form's
 * `aria-invalid` attribute, following DOM (top-to-bottom) order.
 */
export const findFirstInvalidField = (
  root: ParentNode = document,
): HTMLElement | null => root.querySelector<HTMLElement>(INVALID_FIELD_SELECTOR);

/** Scrolls the first `aria-invalid` field into view when it is off-screen. */
export const scrollToFirstInvalidField = (root: ParentNode = document): void => {
  const field = findFirstInvalidField(root);
  if (!field) return;
  scrollFieldIntoView(field);
};

/**
 * Scrolls the field with the given id into view when it is off-screen.
 * Used for inputs that carry no `aria-invalid` (e.g. custom attribute rows).
 */
export const scrollToFieldById = (id: string, root: Document = document): void => {
  const field = root.getElementById(id);
  if (!(field instanceof HTMLElement)) return;
  scrollFieldIntoView(field);
};
