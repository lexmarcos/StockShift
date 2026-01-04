import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginFormData } from "./login.schema";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoginResponse } from "./login.types";
import { toast } from "sonner";

export const useLoginModel = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const response = await api
        .post("auth/login", { json: data })
        .json<LoginResponse>();

      if (response.success) {
        localStorage.setItem("accessToken", response.data.accessToken);
        localStorage.setItem("refreshToken", response.data.refreshToken);
        localStorage.setItem(
          "user",
          JSON.stringify({
            userId: response.data.userId,
            email: response.data.email,
            fullName: response.data.fullName,
          })
        );

        toast.success("Login realizado com sucesso!");
        router.push("/warehouses");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Falha no login. Verifique suas credenciais.");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    form,
    onSubmit,
    isLoading,
  };
};
