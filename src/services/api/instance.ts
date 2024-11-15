const BASE_URL = process.env.NEXT_PUBLIC_BFF_URL;

const getNewRefreshToken = async (
  response: Response,
  input: RequestInfo,
  fetchOptions: RequestInit
) => {
  const refreshResponse = await fetch(`${BASE_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });

  if (refreshResponse.ok) {
    response = await fetch(input, fetchOptions);

    if (response.ok) {
      return response;
    } else {
      throw new Error("Erro na requisição após tentar renovar o token");
    }
  } else {
    throw new Error("Sessão expirada");
  }
};

async function fetchWithRefresh(input: RequestInfo, init: RequestInit = {}): Promise<Response> {
  const fetchOptions: RequestInit = {
    ...init,
    credentials: "include",
  };

  let response = await fetch(input, fetchOptions);

  console.log("response refrehs: ", response.status);

  if (response.ok) {
    return response;
  }

  if (response.status !== 401) {
    return response;
  }

  return getNewRefreshToken(response, input, fetchOptions);
}

const genericFetchOptions = (
  method: "POST" | "GET" | "PUT" | "DELETE" | "PATCH",
  body?: unknown
) => {
  return {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : {},
  } as RequestInit;
};

async function post<T>(endpoint: string, body: unknown): Promise<T> {
  const url = `${BASE_URL}/${endpoint}`;

  const response = await fetchWithRefresh(url, genericFetchOptions("POST", body));

  if (!response.ok) {
    throw new Error("Erro na requisição");
  }

  return response.json() as Promise<T>;
}

async function update<T>(endpoint: string, body: unknown): Promise<T> {
  const url = `${BASE_URL}/${endpoint}`;

  const response = await fetchWithRefresh(url, genericFetchOptions("PUT", body));

  if (!response.ok) {
    throw new Error("Erro na requisição");
  }

  return response.json() as Promise<T>;
}

async function remove<T>(endpoint: string): Promise<T> {
  const url = `${BASE_URL}/${endpoint}`;
  const response = await fetchWithRefresh(url, genericFetchOptions("DELETE"));

  if (!response.ok) {
    throw new Error("Erro na requisição");
  }

  return response.json() as Promise<T>;
}

function getStringParams(params: Record<string, any> | undefined) {
  if (!params) return "";
  return `?${new URLSearchParams(params).toString()}`;
}

async function get<T>(endpoint: string, params?: Record<string, any>) {
  const response = await fetchWithRefresh(`${BASE_URL}/${endpoint}${getStringParams(params)}`, {
    method: "GET",
  });

  console.log(response.status);

  if (!response.ok) {
    throw new Error("Erro na requisição");
  }

  return response.json() as Promise<T>;
}

export const apiInstance = {
  post,
  update,
  remove,
  get,
};
