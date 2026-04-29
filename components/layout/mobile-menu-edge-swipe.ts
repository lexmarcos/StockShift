"use client";

import { useEffect, useRef } from "react";

type SwipePoint = {
  x: number;
  y: number;
};

type UseMobileMenuEdgeSwipeParams = {
  isOpen: boolean;
  openMenu: () => void;
};

const MOBILE_MAX_WIDTH_PX = 767;
const EDGE_ZONE_PX = 28;
const OPEN_DISTANCE_PX = 72;
const VERTICAL_DRIFT_LIMIT_PX = 48;
const HORIZONTAL_DOMINANCE_PX = 24;

const getSingleTouchPoint = (event: TouchEvent): SwipePoint | null => {
  if (event.touches.length !== 1) {
    return null;
  }

  const touch = event.touches[0];
  return { x: touch.clientX, y: touch.clientY };
};

export const isMobileMenuEdgeSwipeStart = (
  point: SwipePoint,
  isOpen: boolean,
  viewportWidth: number
): boolean => {
  if (isOpen || viewportWidth > MOBILE_MAX_WIDTH_PX) {
    return false;
  }

  return point.x <= EDGE_ZONE_PX;
};

export const isMobileMenuOpeningSwipe = (
  startPoint: SwipePoint,
  currentPoint: SwipePoint
): boolean => {
  const deltaX = currentPoint.x - startPoint.x;
  const deltaY = Math.abs(currentPoint.y - startPoint.y);

  return (
    deltaX >= OPEN_DISTANCE_PX &&
    deltaY <= VERTICAL_DRIFT_LIMIT_PX &&
    deltaX >= deltaY + HORIZONTAL_DOMINANCE_PX
  );
};

export const useMobileMenuEdgeSwipe = ({
  isOpen,
  openMenu,
}: UseMobileMenuEdgeSwipeParams): void => {
  const startPointRef = useRef<SwipePoint | null>(null);

  useEffect(() => {
    const resetSwipe = (): void => {
      startPointRef.current = null;
    };

    const handleTouchStart = (event: TouchEvent): void => {
      const point = getSingleTouchPoint(event);
      if (!point) {
        resetSwipe();
        return;
      }

      const canStart = isMobileMenuEdgeSwipeStart(
        point,
        isOpen,
        window.innerWidth
      );
      startPointRef.current = canStart ? point : null;
    };

    const handleTouchMove = (event: TouchEvent): void => {
      const startPoint = startPointRef.current;
      const currentPoint = getSingleTouchPoint(event);
      if (!startPoint) {
        return;
      }

      if (!currentPoint) {
        resetSwipe();
        return;
      }

      if (!isMobileMenuOpeningSwipe(startPoint, currentPoint)) {
        return;
      }

      event.preventDefault();
      resetSwipe();
      openMenu();
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", resetSwipe);
    window.addEventListener("touchcancel", resetSwipe);

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", resetSwipe);
      window.removeEventListener("touchcancel", resetSwipe);
    };
  }, [isOpen, openMenu]);
};
