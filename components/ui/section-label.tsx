import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function SectionLabel({
  icon: Icon,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  icon?: LucideIcon
}) {
  return (
    <div
      data-slot="section-label"
      className={cn(
        "flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-neutral-500",
        className
      )}
      {...props}
    >
      {Icon && <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />}
      {children}
    </div>
  )
}

export { SectionLabel }
