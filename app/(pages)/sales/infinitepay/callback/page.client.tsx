"use client";

import { useInfinitePayCallbackModel } from "./infinitepay-callback.model";
import { InfinitePayCallbackView } from "./infinitepay-callback.view";

export function PageClient() {
  const model = useInfinitePayCallbackModel();
  return <InfinitePayCallbackView {...model} />;
}
