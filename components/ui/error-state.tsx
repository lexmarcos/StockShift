import { AlertTriangle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

function ErrorState({
  title = "Erro ao carregar dados",
  description = "Ocorreu um erro inesperado. Tente novamente.",
  onRetry,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  title?: string
  description?: string
  onRetry?: () => void
}) {
  return (
    <div
      data-slot="error-state"
      className={cn(
        "flex flex-col items-center justify-center rounded-[4px] border border-rose-900/30 bg-rose-950/10 px-6 py-16 text-center",
        className
      )}
      {...props}
    >
      <AlertTriangle className="mb-4 h-8 w-8 text-rose-500" strokeWidth={2} />
      <h3 className="mb-2 text-sm font-bold text-white">{title}</h3>
      <p className="mb-6 max-w-sm text-xs text-neutral-500">{description}</p>
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          className="h-10 rounded-[4px] border-rose-900/30 text-xs font-bold uppercase tracking-wide text-rose-400 hover:bg-rose-950/20"
        >
          TENTAR NOVAMENTE
        </Button>
      )}
    </div>
  )
}

export { ErrorState }
