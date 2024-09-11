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

async function get<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${BASE_URL}/${endpoint}`, {
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
