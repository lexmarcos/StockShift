import { cn } from "@/lib/utils"

function PageContainer({
  className,
  bottomPadding = "default",
  ...props
}: React.ComponentProps<"div"> & {
  bottomPadding?: "default" | "fixed-bar"
}) {
  return (
    <div
      data-slot="page-container"
      className={cn(
        "min-h-screen bg-[#0A0A0A] font-sans text-neutral-200",
        bottomPadding === "fixed-bar" ? "pb-28" : "pb-20",
        className
      )}
      {...props}
    >
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
        {props.children}
      </div>
    </div>
  )
}

export { PageContainer }
