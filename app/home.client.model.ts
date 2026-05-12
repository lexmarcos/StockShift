"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelectedWarehouse } from "@/hooks/use-selected-warehouse";
import {
  createHomeRedirectMessage,
  resolveHomeRedirectPath,
} from "./home.model";
import { HomeViewProps } from "./home.types";

export function useHomeModel(): HomeViewProps {
  const { replace } = useRouter();
  const { warehouseId } = useSelectedWarehouse();
  const redirectPath = resolveHomeRedirectPath(warehouseId);
  const redirectMessage = createHomeRedirectMessage(redirectPath);

  useEffect(() => {
    replace(redirectPath);
  }, [redirectPath, replace]);

  return {
    redirectMessage,
  };
}
