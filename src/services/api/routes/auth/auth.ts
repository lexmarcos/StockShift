import axios from "axios";
const apiUrl = process.env.NEXT_PUBLIC_BFF_URL;
const baseURL = `${apiUrl}/auth`;
export const authApiRoutes = {
  signin: async (data: ISignIn): Promise<IResponseSignIn> => {
    const res = await fetch(`${baseURL}/signin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      throw new Error("Erro na requisição");
    }
    return res.json();
  },
  logout: async (): Promise<IResponseSignIn> => {
    const res = await fetch(`${baseURL}/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
    if (!res.ok) {
      throw new Error("Erro na requisição");
    }
    return res.json();
  },
};
