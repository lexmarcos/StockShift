import axios from "axios";
const baseURL = "http://localhost:3000/api/auth";
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
};
