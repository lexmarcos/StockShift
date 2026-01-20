"use client";

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileWizardHeaderProps {
  title: string;
  onBack?: () => void;
  showBack?: boolean;
}

export const MobileWizardHeader = ({
  title,
  onBack,
  showBack = true,
}: MobileWizardHeaderProps) => {
  return (
    <header className="sticky top-0 z-40 border-b border-neutral-800 bg-[#0A0A0A]">
      <div className="flex h-14 items-center gap-3 px-4">
        {showBack && onBack && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-10 w-10 rounded-[4px] text-neutral-400 hover:bg-neutral-800 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <h1 className="text-sm font-bold uppercase tracking-wide text-white">
          {title}
        </h1>
      </div>
    </header>
  );
};
