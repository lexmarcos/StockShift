const BASE_URL = process.env.NEXT_PUBLIC_BFF_URL;

async function post<T>(endpoint: string, data: unknown): Promise<T> {
  const response = await fetch(`${BASE_URL}/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Erro na requisição");
  }

  return response.json() as Promise<T>;
}

async function update<T>(endpoint: string, data: unknown): Promise<T> {
  const response = await fetch(`${BASE_URL}/${endpoint}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Erro na requisição");
  }

  return response.json() as Promise<T>;
}

async function remove<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${BASE_URL}/${endpoint}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Erro na requisição");
  }

  return response.json() as Promise<T>;
}

function getStringParams(params: Record<string, any> | undefined) {
  if(!params) return "";
  return `?${new URLSearchParams(params).toString()}`;
}

async function get<T>(endpoint: string, params?: Record<string, any>) {
  console.log(`${BASE_URL}/${endpoint}${getStringParams(params)}`)
  const response = await fetch(`${BASE_URL}/${endpoint}${getStringParams(params)}`, {
    method: "GET",
  });

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
