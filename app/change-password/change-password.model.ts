import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  changePasswordSchema,
  ChangePasswordFormData,
} from "./change-password.schema";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { HTTPError } from "ky";
import { mutate } from "swr";

export const useChangePasswordModel = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    setIsLoading(true);
    try {
      await api
        .post("auth/change-password", {
          json: {
            currentPassword: data.currentPassword,
            newPassword: data.newPassword,
          },
        })
        .json();

      toast.success("Senha alterada com sucesso!");
      await mutate("auth/me");
      router.push("/warehouses");
    } catch (error) {
      console.error("Change password error:", error);

      if (error instanceof HTTPError) {
        const body = await error.response.json().catch(() => null);
        const message =
          body?.message || "Não foi possível alterar a senha. Tente novamente.";
        toast.error(message);
      } else {
        toast.error("Não foi possível alterar a senha. Tente novamente.");
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
