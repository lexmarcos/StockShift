"use client";
import { BoxIcon, ChevronRight, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import Navbar from "@/components/navbar/navbar";
import NavbarMobile from "@/components/navbar/navbarMobile";
import AvatarDropdown from "@/components/avatarDropdown/avatarDropdown";
import { Button } from "@/components/ui/button";
import { ButtonIcon } from "@radix-ui/react-icons";
import FooterInventory from "@/components/footerInvetory/footerInventory";

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
            <form>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Procure por produtos..."
                  className="w-full appearance-none bg-background pl-8 shadow-none md:w-2/3 lg:w-1/3"
                />
              </div>
            </form>
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
