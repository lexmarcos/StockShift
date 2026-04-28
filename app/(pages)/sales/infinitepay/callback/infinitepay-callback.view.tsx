"use client";

import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageContainer } from "@/components/ui/page-container";
import type { InfinitePayCallbackViewProps } from "./infinitepay-callback.types";

export function InfinitePayCallbackView({
  isConfirming,
  hasError,
  message,
  retryConfirmation,
}: InfinitePayCallbackViewProps) {
  if (hasError) {
    return (
      <PageContainer>
        <ErrorState
          title="Erro ao confirmar pagamento"
          description="Não foi possível confirmar o retorno da InfinitePay agora."
          onRetry={retryConfirmation}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <LoadingState message={isConfirming ? message : "Redirecionando..."} />
    </PageContainer>
  );
}
