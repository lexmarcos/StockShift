"use client";

import { ReactNode } from "react";
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
}

export function ResponsiveModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
}: ResponsiveModalProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-200">
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
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="rounded-t-[4px] border-neutral-800 bg-[#171717] text-neutral-200 max-h-[90vh]">
        <DrawerHeader className="text-left">
          <DrawerTitle className="text-base font-bold uppercase tracking-wide text-white">
            {title}
          </DrawerTitle>
          <DrawerDescription className="text-xs text-neutral-500">
            {description}
          </DrawerDescription>
        </DrawerHeader>
        <div className="overflow-y-auto px-4">{children}</div>
        {footer && <DrawerFooter className="pt-4">{footer}</DrawerFooter>}
      </DrawerContent>
    </Drawer>
  );
}
