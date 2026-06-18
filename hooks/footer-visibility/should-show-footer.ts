export const FOOTER_SCROLL_THRESHOLD = 8;

export interface FooterVisibilityParams {
  currentScrollY: number;
  lastScrollY: number;
  maxScrollY: number;
  previousVisible?: boolean;
  scrollThreshold?: number;
}

export const shouldShowFooter = ({
  currentScrollY,
  lastScrollY,
  maxScrollY,
  previousVisible = true,
  scrollThreshold = FOOTER_SCROLL_THRESHOLD,
}: FooterVisibilityParams): boolean => {
  const isShortPage = maxScrollY <= scrollThreshold;
  if (isShortPage) return true;

  const isAtPageEnd = currentScrollY >= maxScrollY - scrollThreshold;
  if (isAtPageEnd) return true;

  if (currentScrollY <= scrollThreshold) return true;

  const scrollDelta = currentScrollY - lastScrollY;
  if (Math.abs(scrollDelta) < scrollThreshold) return previousVisible;

  return scrollDelta < 0;
};
