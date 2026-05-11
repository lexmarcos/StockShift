"use client";

import { useInfinitePayResultModel } from "./infinitepay-result.model";
import { InfinitePayResultView } from "./infinitepay-result.view";

interface PageClientProps {
  saleId: string | null;
  status: string | null;
  message: string | null;
}

export function PageClient({ saleId, status, message }: PageClientProps) {
  const model = useInfinitePayResultModel({ saleId, status, message });
  return <InfinitePayResultView {...model} />;
}
