"use client";

import { useInfinitePayResultModel } from "./infinitepay-result.model";
import { InfinitePayResultView } from "./infinitepay-result.view";

export function PageClient() {
  const model = useInfinitePayResultModel();
  return <InfinitePayResultView {...model} />;
}
