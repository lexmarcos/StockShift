import ky, { HTTPError } from "ky";

export const isApiNotFoundError = (error: unknown): boolean => {
  return error instanceof HTTPError && error.response.status === 404;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

if (!API_BASE_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is not set");
}

// Estado para controlar refresh em andamento
let isRefreshing = false;
let isRedirectingToLogin = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });

  failedQueue = [];
};

interface ApiErrorBody {
  error?: string;
}

export const shouldRefreshAccessToken = async (response: Response) => {
  if (response.status === 401) {
    return true;
  }

  if (response.status !== 403) {
    return false;
  }

  try {
    const body = (await response.clone().json()) as ApiErrorBody;
    return body.error !== "Forbidden";
  } catch {
    return true;
  }
};

export const attachApiErrorMessage = async (
  error: HTTPError,
): Promise<HTTPError> => {
  const { response } = error;

  if (isRedirectingToLogin) return error;

  if (response && response.status !== 403) {
    try {
      const body = (await response.json()) as { message?: string };
      error.message = body.message || error.message;
    } catch {
      // Se não conseguir parsear, mantém mensagem original
    }
  }

  return error;
};

const redirectToLogin = () => {
  if (typeof window === "undefined" || isRedirectingToLogin) return;
  isRedirectingToLogin = true;
  localStorage.removeItem("user-data");
  localStorage.removeItem("selected-warehouse-id");
  window.location.href = "/login";
};

const retryAfterRefreshClient = ky.create({
  credentials: "include",
  timeout: 30000,
  retry: 0,
  hooks: {
    beforeError: [attachApiErrorMessage],
  },
});

export const api = ky.create({
  prefixUrl: `${API_BASE_URL}/api`,
  credentials: "include",
  timeout: 30000,
  retry: 0,
  hooks: {
    beforeError: [attachApiErrorMessage],
    afterResponse: [
      async (request, _options, response) => {
        // Se já estamos redirecionando, não processa mais nada
        if (isRedirectingToLogin) return response;

        if (await shouldRefreshAccessToken(response)) {
          if (!isRefreshing) {
            isRefreshing = true;

            try {
              await ky.post(`${API_BASE_URL}/api/auth/refresh`, {
                credentials: "include",
              });

              processQueue();
              isRefreshing = false;

              // Retry da requisição original
              return retryAfterRefreshClient(request.clone());
            } catch (refreshError) {
              processQueue(refreshError as Error);
              isRefreshing = false;

              // Refresh falhou - redirecionar para login
              redirectToLogin();
              return response;
            }
          } else {
            // Se já está fazendo refresh, adiciona à fila
            try {
              await new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
              });

              // Se o redirect já foi iniciado, não tenta retry
              if (isRedirectingToLogin) return response;

              // Retry da requisição original após refresh
              return retryAfterRefreshClient(request.clone());
            } catch {
              // Refresh falhou enquanto esperava na fila
              return response;
            }
          }
        }

        return response;
      },
    ],
  },
});
