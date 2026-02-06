import { cn } from "@/lib/utils"

function PageHeader({
  title,
  subtitle,
  actions,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}) {
  return (
    <div
      data-slot="page-header"
      className={cn("mb-8 flex items-center justify-between", className)}
      {...props}
    >
      <div>
        {subtitle && (
          <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
            {subtitle}
          </p>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-white">
          {title}
        </h1>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

export { PageHeader }
