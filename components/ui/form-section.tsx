import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card"

function FormSection({
  icon: Icon,
  iconColor = "text-blue-400",
  title,
  description,
  headerAction,
  children,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  icon: LucideIcon
  iconColor?: string
  title: string
  description?: string
  headerAction?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Card
      data-slot="form-section"
      className={cn(
        "rounded-[4px] border-neutral-800 bg-[#171717] py-0 shadow-none",
        className
      )}
      {...props}
    >
      <CardHeader className="border-b border-neutral-800 px-5 py-4">
        <div className="flex items-center gap-3">
          <Icon className={cn("h-5 w-5", iconColor)} strokeWidth={2} />
          <div>
            <CardTitle className="text-sm font-bold text-white">
              {title}
            </CardTitle>
            {description && (
              <CardDescription className="mt-1 text-xs text-neutral-500">
                {description}
              </CardDescription>
            )}
          </div>
        </div>
        {headerAction && <CardAction>{headerAction}</CardAction>}
      </CardHeader>
      <CardContent className="space-y-5 px-5 py-5">{children}</CardContent>
    </Card>
  )
}

export { FormSection }
