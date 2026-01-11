"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export const LayoutContent = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();

  return (
    <>
      {children}
    </>
  );
};
