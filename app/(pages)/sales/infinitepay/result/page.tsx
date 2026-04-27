"use client";

import { useInfinitePayResultModel } from "./infinitepay-result.model";
import { InfinitePayResultView } from "./infinitepay-result.view";

export default function InfinitePayResultPage() {
  const model = useInfinitePayResultModel();
  return <InfinitePayResultView {...model} />;
}
