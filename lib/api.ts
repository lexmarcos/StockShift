import ky from "ky";

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

const redirectToLogin = () => {
  if (typeof window === "undefined" || isRedirectingToLogin) return;
  isRedirectingToLogin = true;
  localStorage.removeItem("user-data");
  localStorage.removeItem("selected-warehouse-id");
  window.location.href = "/login";
};

export const api = ky.create({
  prefixUrl: `${API_BASE_URL}/api`,
  credentials: "include",
  timeout: 30000,
  retry: 0,
  hooks: {
    beforeError: [
      async (error) => {
        const { response } = error;

        // Não tenta processar se já estamos redirecionando
        if (isRedirectingToLogin) return error;

        // Para erros que não são 403, tenta extrair mensagem da API
        if (response && response.status !== 403) {
          try {
            const body = (await response.json()) as { message?: string };
            error.message = body.message || error.message;
          } catch {
            // Se não conseguir parsear, mantém mensagem original
          }
        }

        return error;
      },
    ],
    afterResponse: [
      async (request, _options, response) => {
        // Se já estamos redirecionando, não processa mais nada
        if (isRedirectingToLogin) return response;

        // Se receber 403, tenta refresh automaticamente
        if (response.status === 403) {
          if (!isRefreshing) {
            isRefreshing = true;

            try {
              await ky.post(`${API_BASE_URL}/api/auth/refresh`, {
                credentials: "include",
              });

              processQueue();
              isRefreshing = false;

              // Retry da requisição original
              return ky(request.clone(), {
                credentials: "include",
              });
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
              return ky(request.clone(), {
                credentials: "include",
              });
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
