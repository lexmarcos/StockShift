const INFINITEPAY_DEEPLINK_BASE = "infinitepaydash://infinitetap-app";

export interface InfinitePayParams {
  amount: number;
  paymentMethod: "credit" | "debit";
  installments: number;
  orderId: string;
  handle: string;
  docNumber: string;
  resultUrl: string;
}

export function buildInfinitePayDeeplink(params: InfinitePayParams): string {
  const queryParams = new URLSearchParams({
    amount: String(params.amount),
    payment_method: params.paymentMethod,
    installments: String(params.installments),
    order_id: params.orderId,
    result_url: params.resultUrl,
    app_client_referrer: "StockShift",
    handle: params.handle,
    doc_number: params.docNumber,
    af_force_deeplink: "true",
  });

  return `${INFINITEPAY_DEEPLINK_BASE}?${queryParams.toString()}`;
}

export const INFINITEPAY_PAYMENT_METHODS = new Set([
  "DEBIT_CARD",
  "CREDIT_CARD",
  "INSTALLMENT",
]);

export function mapPaymentMethodToInfinitePay(
  method: string,
): "credit" | "debit" {
  return method === "DEBIT_CARD" ? "debit" : "credit";
}
