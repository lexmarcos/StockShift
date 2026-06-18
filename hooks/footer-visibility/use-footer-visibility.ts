"use client";

import { useEffect, useRef, useState } from "react";
import {
  shouldShowFooter,
  type FooterVisibilityParams,
} from "./should-show-footer";

export interface UseFooterVisibilityOptions {
  initialVisible?: boolean;
  scrollThreshold?: number;
}

export interface FooterVisibilityState {
  isFooterVisible: boolean;
}

const resolveScrollMetrics = (): Pick<
  FooterVisibilityParams,
  "currentScrollY" | "maxScrollY"
> => ({
  currentScrollY: window.scrollY,
  maxScrollY:
    document.documentElement.scrollHeight - window.innerHeight,
});

export const useFooterVisibility = ({
  initialVisible = true,
  scrollThreshold,
}: UseFooterVisibilityOptions = {}): FooterVisibilityState => {
  const [isFooterVisible, setIsFooterVisible] = useState(initialVisible);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    const handleScroll = (): void => {
      const { currentScrollY, maxScrollY } = resolveScrollMetrics();
      setIsFooterVisible((prevVisible) =>
        shouldShowFooter({
          currentScrollY,
          lastScrollY: lastScrollYRef.current,
          maxScrollY,
          previousVisible: prevVisible,
          scrollThreshold,
        }),
      );
      lastScrollYRef.current = Math.max(currentScrollY, 0);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scrollThreshold]);

  return { isFooterVisible };
};
