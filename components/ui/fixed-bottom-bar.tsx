import { cn } from "@/lib/utils"

function FixedBottomBar({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="fixed-bottom-bar"
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-800 bg-[#0A0A0A] px-4 py-4 md:ml-[var(--sidebar-width)] md:px-6",
        className
      )}
      {...props}
    />
  )
}

export { FixedBottomBar }
