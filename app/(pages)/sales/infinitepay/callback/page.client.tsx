"use client";

import { useInfinitePayCallbackModel } from "./infinitepay-callback.model";
import { InfinitePayCallbackView } from "./infinitepay-callback.view";

interface PageClientProps {
  callbackQueryString: string;
}

export function PageClient({ callbackQueryString }: PageClientProps) {
  const model = useInfinitePayCallbackModel(callbackQueryString);
  return <InfinitePayCallbackView {...model} />;
}
