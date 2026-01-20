"use client";

import { useEffect, useState } from "react";
import { StockMovementCreateMobileView } from "./stock-movements-create-mobile.view";
import { StockMovementCreateView } from "./stock-movements-create.view";
import { useStockMovementCreateModel } from "./stock-movements-create.model";

export default function StockMovementCreatePage() {
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const model = useStockMovementCreateModel();

  if (!isClient) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-700 border-t-blue-500" />
      </div>
    );
  }

  if (isMobile) {
    return <StockMovementCreateMobileView />;
  }

  return <StockMovementCreateView {...model} />;
}
