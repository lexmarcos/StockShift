"use client";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import Navbar from "@/components/navbar/navbar";
import NavbarMobile from "@/components/navbar/navbarMobile";
import AvatarDropdown from "@/components/avatarDropdown/avatarDropdown";
import FooterInventory from "@/components/footerInvetory/footerInventory";
import SearchProductsBar from "@/components/searchProductBar/searchProcutBar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="md:grid md:min-h-screen md:w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <Navbar />
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <NavbarMobile />
          <div className="w-full flex-1">
            <SearchProductsBar />
          </div>
          <AvatarDropdown />
        </header>
        <main className="flex flex-1 flex-col p-4">
          {children}
          <FooterInventory />
        </main>
      </div>
    </div>
  );
}
