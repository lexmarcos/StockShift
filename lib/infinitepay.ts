const INFINITEPAY_DEEPLINK_BASE = "infinitepaydash://infinitetap-app";
const INFINITEPAY_CALLBACK_PATH = "/sales/infinitepay/callback";

export interface InfinitePayParams {
  amount: number;
  paymentMethod: "credit" | "debit";
  installments: number;
  orderId: string;
  handle: string | null | undefined;
  docNumber: string | null | undefined;
  resultUrl: string;
}

function normalizeInfinitePayHandle(handle: string | null | undefined): string {
  return handle?.trim().replace(/^\$+/, "") ?? "";
}

function normalizeInfinitePayDocNumber(docNumber: string | null | undefined): string {
  return docNumber?.replace(/\D/g, "") ?? "";
}

export function buildInfinitePayDeeplink(params: InfinitePayParams): string {
  const queryParams = new URLSearchParams({
    amount: String(params.amount),
    payment_method: params.paymentMethod,
    order_id: params.orderId,
    result_url: params.resultUrl,
    app_client_referrer: "StockShift",
    af_force_deeplink: "true",
  });

  if (params.paymentMethod === "credit") {
    queryParams.set("installments", String(params.installments));
  }

  const handle = normalizeInfinitePayHandle(params.handle);
  if (handle) {
    queryParams.set("handle", handle);
  }

  const docNumber = normalizeInfinitePayDocNumber(params.docNumber);
  if (docNumber) {
    queryParams.set("doc_number", docNumber);
  }

  return `${INFINITEPAY_DEEPLINK_BASE}?${queryParams.toString()}`;
}

export function buildInfinitePayCallbackUrl(origin: string): string {
  return `${origin.replace(/\/+$/, "")}${INFINITEPAY_CALLBACK_PATH}`;
}

export function mapPaymentMethodToInfinitePay(
  method: string,
): "credit" | "debit" {
  return method === "DEBIT_CARD" ? "debit" : "credit";
}
