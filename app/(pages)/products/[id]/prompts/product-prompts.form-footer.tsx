"use client";

import { Bot, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ProductPromptFormFooter({
  cancelLabel,
  isSubmitting,
  loadingLabel,
  onCancel,
  submitLabel,
}: {
  cancelLabel: string;
  isSubmitting: boolean;
  loadingLabel?: string;
  onCancel: () => void;
  submitLabel: string;
}) {
  const displayedSubmitLabel = isSubmitting && loadingLabel ? loadingLabel : submitLabel;

  return (
    <div className="flex flex-col-reverse gap-2 border-t border-neutral-800 pt-4 md:flex-row md:justify-end">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        className="rounded-[4px] border-neutral-800 bg-transparent text-xs font-bold uppercase tracking-wide text-neutral-300 hover:bg-neutral-900"
      >
        <X className="mr-2 size-4" />
        {cancelLabel}
      </Button>
      <Button
        type="submit"
        disabled={isSubmitting}
        aria-busy={isSubmitting}
        className="min-h-12 w-full rounded-[4px] bg-blue-600 px-4 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700 md:min-h-10 md:w-auto"
      >
        {isSubmitting ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Bot className="size-4" />
        )}
        <span className="min-w-0 text-center leading-tight">
          {displayedSubmitLabel}
        </span>
      </Button>
    </div>
  );
}
