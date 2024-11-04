import { Home, PackageSearch, Plus } from "lucide-react";
import FooterButton from "./buttonsFooter/buttonFooter";
import { usePathname, useRouter } from "next/navigation";
import { FooterDrawerNewOptions } from "./footerDrawerNewOptions/footerDrawerNewOptions";
import { useState } from "react";

export default function FooterInventory() {
  const router = useRouter();
  const pathname = usePathname();

  const isRouteActive = (routeToCheck: string) => {
    return pathname.includes(routeToCheck);
  };

  return (
    <footer className="fixed bottom-0 left-0 w-full flex justify-center">
      <div className="bg-primary-foreground/50 backdrop-blur-md w-fit flex justify-center items-center gap-8 border-t px-5 rounded-t-2xl">
        <FooterButton
          isActive={isRouteActive("/dashboard")}
          onClick={() => router.push("/dashboard")}
        >
          <Home size={24} />
        </FooterButton>
        <button className="rounded-full dark:bg-white dark:text-background p-2 pointer-events-none opacity-0">
          <Plus size={32} />
        </button>
        <FooterDrawerNewOptions
          trigger={
            <button className="rounded-full dark:bg-white dark:text-background p-2 absolute bottom-1">
              <Plus size={36} />
            </button>
          }
        />
        <FooterButton
          isActive={isRouteActive("/products")}
          onClick={() => router.push("/products")}
        >
          <PackageSearch size={24} />
        </FooterButton>
      </div>
    </footer>
  );
}
