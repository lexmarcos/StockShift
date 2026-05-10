"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type {
  InfinitePayCallbackViewProps,
  InfinitePayConfirmResponse,
  InfinitePayConfirmResult,
} from "./infinitepay-callback.types";

const INFINITEPAY_CALLBACK_PARAMS = [
  "order_id",
  "nsu",
  "aut",
  "card_brand",
  "warning",
] as const;

export function buildInfinitePayConfirmParams(queryString: string): URLSearchParams {
  const sourceParams = new URLSearchParams(queryString);
  const confirmParams = new URLSearchParams();

  INFINITEPAY_CALLBACK_PARAMS.forEach((paramName) => {
    const paramValue = sourceParams.get(paramName);
    if (paramValue) confirmParams.set(paramName, paramValue);
  });

  return confirmParams;
}

export function buildInfinitePayResultPath(result: InfinitePayConfirmResult): string {
  const resultParams = new URLSearchParams({ status: result.status });
  if (result.saleId) resultParams.set("sale_id", result.saleId);
  if (result.message) resultParams.set("message", result.message);
  return `/sales/infinitepay/result?${resultParams.toString()}`;
}

export function useInfinitePayCallbackModel(
  callbackQueryString = "",
): InfinitePayCallbackViewProps {
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(true);
  const [hasError, setHasError] = useState(false);

  const confirmPayment = useCallback(async () => {
    setIsConfirming(true);
    setHasError(false);

    try {
      const confirmParams = buildInfinitePayConfirmParams(callbackQueryString);
      if (!confirmParams.has("order_id")) {
        router.replace(buildInfinitePayResultPath({
          status: "error",
          saleId: null,
          message: "invalid_order",
        }));
        return;
      }

      const response = await api.get("sales/infinitepay/confirm", {
        searchParams: confirmParams,
      }).json<InfinitePayConfirmResponse>();
      router.replace(buildInfinitePayResultPath(response.data));
    } catch {
      setHasError(true);
      setIsConfirming(false);
    }
  }, [callbackQueryString, router]);

  useEffect(() => {
    void confirmPayment();
  }, [confirmPayment]);

  return {
    isConfirming,
    hasError,
    message: "Confirmando retorno da InfinitePay...",
    retryConfirmation: confirmPayment,
  };
}
