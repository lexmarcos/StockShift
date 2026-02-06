import { cn } from "@/lib/utils"

const statusColorMap = {
  info: "border-l-blue-600",
  success: "border-l-emerald-600",
  warning: "border-l-amber-500",
  error: "border-l-rose-600",
  neutral: "border-l-neutral-600",
} as const

function StatusCard({
  status,
  className,
  onClick,
  ...props
}: React.ComponentProps<"div"> & {
  status: keyof typeof statusColorMap
  onClick?: () => void
}) {
  return (
    <div
      data-slot="status-card"
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") onClick()
            }
          : undefined
      }
      className={cn(
        "rounded-[4px] border border-neutral-800 border-l-4 bg-[#171717]",
        statusColorMap[status],
        onClick && "cursor-pointer hover:bg-neutral-800/50",
        className
      )}
      {...props}
    />
  )
}

export { StatusCard }
