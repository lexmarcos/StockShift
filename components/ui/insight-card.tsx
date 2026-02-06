import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

const colorMap = {
  blue: "text-blue-400 bg-blue-500/10",
  emerald: "text-emerald-400 bg-emerald-500/10",
  amber: "text-amber-400 bg-amber-500/10",
  rose: "text-rose-400 bg-rose-500/10",
} as const

function InsightCard({
  icon: Icon,
  color = "blue",
  label,
  value,
  suffix,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  icon: LucideIcon
  color?: keyof typeof colorMap
  label: string
  value: string | number
  suffix?: string
}) {
  return (
    <div
      data-slot="insight-card"
      className={cn(
        "rounded-[4px] border border-neutral-800 bg-[#171717] px-5 py-4",
        className
      )}
      {...props}
    >
      <div className="mb-3 flex items-center gap-2">
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-[4px]",
            colorMap[color]
          )}
        >
          <Icon className="h-4 w-4" strokeWidth={2} />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="font-mono text-2xl font-bold tracking-tighter text-white">
          {value}
        </span>
        {suffix && (
          <span className="text-xs text-neutral-500">{suffix}</span>
        )}
      </div>
    </div>
  )
}

export { InsightCard }
