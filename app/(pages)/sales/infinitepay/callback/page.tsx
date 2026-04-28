"use client";

import { useInfinitePayCallbackModel } from "./infinitepay-callback.model";
import { InfinitePayCallbackView } from "./infinitepay-callback.view";

export default function InfinitePayCallbackPage() {
  const model = useInfinitePayCallbackModel();
  return <InfinitePayCallbackView {...model} />;
}
