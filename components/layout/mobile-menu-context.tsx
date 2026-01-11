"use client";

import { createContext, useContext, useMemo, useState } from "react";

type MobileMenuContextValue = {
  isOpen: boolean;
  openMenu: () => void;
  closeMenu: () => void;
  toggleMenu: () => void;
};

const MobileMenuContext = createContext<MobileMenuContextValue | null>(null);

export const MobileMenuProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const value = useMemo(
    () => ({
      isOpen,
      openMenu: () => setIsOpen(true),
      closeMenu: () => setIsOpen(false),
      toggleMenu: () => setIsOpen((prev) => !prev),
    }),
    [isOpen]
  );

  return (
    <MobileMenuContext.Provider value={value}>
      {children}
    </MobileMenuContext.Provider>
  );
};

export const useMobileMenu = () => {
  const context = useContext(MobileMenuContext);
  if (!context) {
    throw new Error("useMobileMenu must be used within MobileMenuProvider");
  }
  return context;
};
