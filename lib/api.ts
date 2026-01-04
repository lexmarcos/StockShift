import ky, { HTTPError } from "ky";

// Estado para controlar refresh em andamento
let isRefreshing = false;
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

export const api = ky.create({
  prefixUrl: "http://localhost:8080/api",
  credentials: "include", // ← OBRIGATÓRIO: Habilita envio de cookies
  timeout: 30000,
  retry: 0, // Desabilita retry automático (vamos controlar manualmente)
  hooks: {
    beforeError: [
      async (error) => {
        const { response } = error;

        // Se for 401, tenta refresh de token
        if (response?.status === 403) {
          // Se já está fazendo refresh, adiciona à fila
          if (isRefreshing) {
            await new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            });
            // Não retorna nada, apenas aguarda o refresh
            return error;
          }

          isRefreshing = true;

          try {
            // Tenta fazer refresh do token
            await ky.post("http://localhost:8080/api/auth/refresh", {
              credentials: "include",
            });

            processQueue();
            isRefreshing = false;

            // Nota: o retry deve ser feito via retry hook ou manualmente
            // beforeError deve retornar apenas o error modificado
            return error;
          } catch (refreshError) {
            processQueue(refreshError as Error);
            isRefreshing = false;

            // Refresh falhou - redirecionar para login
            if (typeof window !== "undefined") {
              window.location.href = "/login";
            }
            return error;
          }
        }

        // Para outros erros, tenta extrair mensagem da API
        if (response) {
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
        // Se receber 401, tenta refresh automaticamente
        if (response.status === 403) {
          if (!isRefreshing) {
            isRefreshing = true;

            try {
              await ky.post("http://localhost:8080/api/auth/refresh", {
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
              if (typeof window !== "undefined") {
                window.location.href = "/login";
              }
              return response;
            }
          } else {
            // Se já está fazendo refresh, adiciona à fila
            await new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            });
            // Retry da requisição original após refresh
            return ky(request.clone(), {
              credentials: "include",
            });
          }
        }

        return response;
      },
    ],
  },
});
