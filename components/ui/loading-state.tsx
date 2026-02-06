import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

function LoadingState({
  message = "Carregando...",
  className,
  ...props
}: React.ComponentProps<"div"> & {
  message?: string
}) {
  return (
    <div
      data-slot="loading-state"
      className={cn(
        "flex flex-col items-center justify-center py-16",
        className
      )}
      {...props}
    >
      <Loader2 className="mb-3 h-8 w-8 animate-spin text-blue-600" strokeWidth={2} />
      <p className="text-xs text-neutral-500">{message}</p>
    </div>
  )
}

export { LoadingState }
