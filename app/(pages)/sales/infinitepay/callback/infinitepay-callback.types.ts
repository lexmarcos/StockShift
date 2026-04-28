import type { InfinitePayCallbackStatus } from "./infinitepay-callback.schema";

export interface InfinitePayConfirmResult {
  status: InfinitePayCallbackStatus;
  saleId: string | null;
  message: string | null;
}

export interface InfinitePayConfirmResponse {
  success: boolean;
  message: string;
  data: InfinitePayConfirmResult;
}

export interface InfinitePayCallbackViewProps {
  isConfirming: boolean;
  hasError: boolean;
  message: string;
  retryConfirmation: () => void;
}
