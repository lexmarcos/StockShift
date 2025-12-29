import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

type ColorScheme =
  | "blue"
  | "purple"
  | "orange"
  | "green"
  | "slate"
  | "red"
  | "pink"
  | "amber"
  | "cyan"
  | "indigo"
  | "teal"
  | "lime";

const colorSchemes: Record<ColorScheme, string> = {
  blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  purple:
    "bg-gradient-to-br from-purple-100 to-purple-200 text-purple-600 dark:from-purple-900/30 dark:to-purple-800/20 dark:text-purple-400",
  orange:
    "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
  green: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  slate: "bg-slate-100 text-slate-600 dark:bg-slate-900/30 dark:text-slate-400",
  red: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  pink: "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400",
  amber: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  cyan: "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400",
  indigo:
    "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
  teal: "bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400",
  lime: "bg-lime-100 text-lime-600 dark:bg-lime-900/30 dark:text-lime-400",
};

interface IconBoxProps {
  icon: LucideIcon;
  colorScheme?: ColorScheme;
  className?: string;
}

export const IconBox = ({
  icon: Icon,
  colorScheme = "blue",
  className,
}: IconBoxProps) => {
  return (
    <div
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-lg",
        colorSchemes[colorScheme],
        className
      )}
    >
      <Icon className="h-5 w-5" />
    </div>
  );
};
