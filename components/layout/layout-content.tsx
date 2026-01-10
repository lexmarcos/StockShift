"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/header/header";
import { ReactNode } from "react";

export const LayoutContent = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  return (
    <>
      {!isLoginPage && <Header />}
      {children}
    </>
  );
};
