"use client";

import { CSSProperties, ReactNode, useEffect, useState } from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";

interface ResponsiveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
}

type MobileDrawerViewportStyle = CSSProperties & {
  "--responsive-modal-bottom"?: string;
  "--responsive-modal-max-height"?: string;
};

const MOBILE_DRAWER_OFFSET = 12;
const MOBILE_DRAWER_MIN_HEIGHT = 160;
const PASSIVE_VISUAL_VIEWPORT_OPTIONS: AddEventListenerOptions = {
  passive: true,
};

const getDefaultMobileDrawerStyle = (): MobileDrawerViewportStyle => ({
  "--responsive-modal-bottom": "0px",
  "--responsive-modal-max-height": "calc(100dvh - 12px)",
});

const getMobileDrawerViewportStyle = (): MobileDrawerViewportStyle => {
  const viewport = window.visualViewport;
  const viewportHeight = viewport?.height ?? window.innerHeight;
  const viewportOffsetTop = viewport?.offsetTop ?? 0;
  const bottomInset = window.innerHeight - viewportHeight - viewportOffsetTop;
  const maxHeight = Math.min(
    viewportHeight,
    Math.max(MOBILE_DRAWER_MIN_HEIGHT, viewportHeight - MOBILE_DRAWER_OFFSET)
  );

  return {
    "--responsive-modal-bottom": `${Math.max(0, Math.round(bottomInset))}px`,
    "--responsive-modal-max-height": `${Math.round(maxHeight)}px`,
  };
};

const useMobileDrawerViewportStyle = (
  open: boolean
): MobileDrawerViewportStyle => {
  const [style, setStyle] = useState<MobileDrawerViewportStyle>(
    getDefaultMobileDrawerStyle
  );

  useEffect(() => {
    if (!open) {
      setStyle(getDefaultMobileDrawerStyle());
      return;
    }

    const updateStyle = () => setStyle(getMobileDrawerViewportStyle());
    const viewport = window.visualViewport;

    updateStyle();
    window.addEventListener("resize", updateStyle);
    viewport?.addEventListener("resize", updateStyle);
    viewport?.addEventListener(
      "scroll",
      updateStyle,
      PASSIVE_VISUAL_VIEWPORT_OPTIONS
    );

    return () => {
      window.removeEventListener("resize", updateStyle);
      viewport?.removeEventListener("resize", updateStyle);
      viewport?.removeEventListener("scroll", updateStyle);
    };
  }, [open]);

  return style;
};

export function ResponsiveModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  maxWidth = "sm:max-w-[600px]",
}: ResponsiveModalProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const mobileDrawerViewportStyle = useMobileDrawerViewportStyle(open);

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={`${maxWidth} rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-200`}>
          <DialogHeader>
            <DialogTitle className="text-base font-bold uppercase tracking-wide text-white">
              {title}
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">
              {description}
            </DialogDescription>
          </DialogHeader>
          {children}
          {footer && <DialogFooter className="gap-2 pt-4">{footer}</DialogFooter>}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      repositionInputs={false}
    >
      <DrawerContent
        style={mobileDrawerViewportStyle}
        className="overflow-hidden rounded-t-[4px] border-neutral-800 bg-[#171717] text-neutral-200 data-[vaul-drawer-direction=bottom]:bottom-[var(--responsive-modal-bottom)] data-[vaul-drawer-direction=bottom]:max-h-[var(--responsive-modal-max-height)]"
      >
        <DrawerHeader className="shrink-0 text-left">
          <DrawerTitle className="text-base font-bold uppercase tracking-wide text-white">
            {title}
          </DrawerTitle>
          <DrawerDescription className="text-xs text-neutral-500">
            {description}
          </DrawerDescription>
        </DrawerHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {children}
          {footer && (
            <DrawerFooter className="relative mt-6 border-t border-neutral-800 px-0 pb-0 pt-4">
              {footer}
            </DrawerFooter>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
