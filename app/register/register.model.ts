import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, RegisterFormData } from "./register.schema";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { RegisterResponse } from "./register.types";
import { toast } from "sonner";
import { useAuth } from "@/lib/contexts/auth-context";
import { HTTPError } from "ky";

export const useRegisterModel = () => {
  const router = useRouter();
  const { setUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      companyName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const payload = {
        companyName: data.companyName,
        email: data.email,
        password: data.password,
      };

      const response = await api
        .post("auth/register", { json: payload })
        .json<RegisterResponse>();

      if (response.success) {
        setUser({
          userId: response.data.userId,
          email: response.data.userEmail,
          fullName: response.data.businessName,
        });

        toast.success("Empresa cadastrada com sucesso!");
        router.push("/warehouses");
      }
    } catch (error) {
      console.error("Register error:", error);

      if (error instanceof HTTPError) {
        const errorBody = await error.response.json().catch(() => null);
        const errorMessage = errorBody?.message || "Falha no cadastro. Tente novamente.";
        toast.error(errorMessage);
      } else {
        toast.error("Falha no cadastro. Tente novamente.");
      }
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
