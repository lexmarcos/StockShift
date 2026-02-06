import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  icon: LucideIcon
  title: string
  description: string
  action?: { label: string; onClick: () => void }
}) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-center justify-center rounded-[4px] border border-dashed border-neutral-800 px-6 py-16 text-center",
        className
      )}
      {...props}
    >
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-neutral-900">
        <Icon className="h-8 w-8 text-neutral-600" strokeWidth={2} />
      </div>
      <h3 className="mb-2 text-sm font-bold text-white">{title}</h3>
      <p className="mb-6 max-w-sm text-xs text-neutral-500">{description}</p>
      {action && (
        <Button
          onClick={action.onClick}
          className="h-10 rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700"
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}

export { EmptyState }
