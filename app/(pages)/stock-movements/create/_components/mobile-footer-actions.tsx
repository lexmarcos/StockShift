"use client";

import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FooterAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "blue" | "emerald" | "neutral";
  icon?: LucideIcon;
}

interface MobileFooterActionsProps {
  primaryAction: FooterAction;
  secondaryAction?: FooterAction;
  progress?: {
    value: number;
    max: number;
    label: string;
  };
}

export const MobileFooterActions = ({
  primaryAction,
  secondaryAction,
  progress,
}: MobileFooterActionsProps) => {
  const getButtonClasses = (variant: FooterAction["variant"] = "blue") => {
    const variants = {
      blue: "bg-blue-600 hover:bg-blue-700 shadow-[0_0_20px_-5px_rgba(37,99,235,0.3)]",
      emerald: "bg-emerald-600 hover:bg-emerald-700 shadow-[0_0_20px_-5px_rgba(5,150,105,0.3)]",
      neutral: "bg-neutral-800 hover:bg-neutral-700",
    };
    return variants[variant];
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-800 bg-[#0A0A0A]/95 backdrop-blur-sm md:ml-[var(--sidebar-width)]">
      {progress && (
        <div className="px-4 pt-3">
          <div className="flex items-center justify-between mb-2">
            <div className="h-1 flex-1 rounded-full bg-neutral-800 overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${(progress.value / progress.max) * 100}%` }}
              />
            </div>
            <span className="ml-3 text-xs font-medium text-neutral-400">
              {progress.label}
            </span>
          </div>
        </div>
      )}

      <div className={cn(
        "flex gap-3 p-4",
        secondaryAction ? "grid grid-cols-2" : ""
      )}>
        {secondaryAction && (
          <Button
            type="button"
            onClick={secondaryAction.onClick}
            disabled={secondaryAction.disabled}
            className={cn(
              "h-14 rounded-[4px] text-xs font-bold uppercase tracking-wide text-white",
              getButtonClasses(secondaryAction.variant || "neutral")
            )}
          >
            {secondaryAction.icon && (
              <secondaryAction.icon className="mr-2 h-4 w-4" />
            )}
            {secondaryAction.label}
          </Button>
        )}

        <Button
          type="button"
          onClick={primaryAction.onClick}
          disabled={primaryAction.disabled}
          className={cn(
            "h-14 rounded-[4px] text-xs font-bold uppercase tracking-wide text-white",
            getButtonClasses(primaryAction.variant),
            !secondaryAction && "w-full"
          )}
        >
          {primaryAction.icon && (
            <primaryAction.icon className="mr-2 h-4 w-4" />
          )}
          {primaryAction.label}
        </Button>
      </div>
    </div>
  );
};
