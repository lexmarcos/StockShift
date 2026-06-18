"use client";

import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

interface InlineDuplicateWarningDrawerProps {
  message: string | null | undefined;
  onOpenChange: (open: boolean) => void;
}

/**
 * Bottom drawer shown when a scanned barcode belongs to a product that is
 * already in the movement as a new (inline) product and therefore cannot be
 * added again. Shared by the stock movement creation flow and the inline
 * new-product form.
 */
export const InlineDuplicateWarningDrawer = ({
  message,
  onOpenChange,
}: InlineDuplicateWarningDrawerProps) => (
  <Drawer open={Boolean(message)} onOpenChange={onOpenChange} direction="bottom">
    <DrawerContent className="border-neutral-800 bg-[#171717]">
      <div className="mx-auto w-full max-w-md">
        <DrawerHeader className="px-4 pb-2 pt-4 text-left">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-[4px] border border-amber-900/40 bg-amber-950/20">
              <AlertCircle className="size-4 text-amber-500" />
            </div>
            <DrawerTitle className="text-sm font-bold uppercase tracking-wide text-white">
              Produto já na movimentação
            </DrawerTitle>
          </div>
        </DrawerHeader>
        <div className="px-4 pb-2">
          <div className="rounded-[4px] border border-amber-900/30 bg-amber-950/10 px-4 py-3">
            <DrawerDescription className="text-xs leading-relaxed text-amber-400/90">
              {message}
            </DrawerDescription>
          </div>
        </div>
        <div className="flex flex-col gap-2 p-4">
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            className="h-10 w-full rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700"
          >
            Entendi
          </Button>
        </div>
      </div>
    </DrawerContent>
  </Drawer>
);
