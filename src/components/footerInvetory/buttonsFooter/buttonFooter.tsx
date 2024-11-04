import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, ReactElement } from "react";

interface IFooterButton extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactElement;
  isActive: boolean;
}
export default function FooterButton({
  children,
  isActive,
  ...props
}: IFooterButton) {
  return (
    <button
      {...props}
      className={cn([
        "rounded-ful text-muted-foreground/70 w-11 h-11 flex justify-center items-center transition-transform duration-300 animate-in anim",
        isActive && "text-foreground bg-none scale-125",
      ])}
    >
      {children}
    </button>
  );
}
