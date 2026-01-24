import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginFormData } from "./login.schema";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { LoginResponse } from "./login.types";
import { toast } from "sonner";
import { useAuth } from "@/lib/contexts/auth-context";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import { HTTPError } from "ky";

export const useLoginModel = () => {
  const router = useRouter();
  const { setUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [requiresCaptcha, setRequiresCaptcha] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<HCaptcha>(null);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onCaptchaVerify = (token: string) => {
    setCaptchaToken(token);
  };

  const onCaptchaExpire = () => {
    setCaptchaToken(null);
  };

  const resetCaptcha = () => {
    setCaptchaToken(null);
    captchaRef.current?.resetCaptcha();
  };

  const onSubmit = async (data: LoginFormData) => {
    if (requiresCaptcha && !captchaToken) {
      toast.error("Por favor, resolva o captcha.");
      return;
    }

    setIsLoading(true);
    try {
      const payload = requiresCaptcha
        ? { ...data, captchaToken }
        : data;

      const response = await api
        .post("auth/login", { json: payload })
        .json<LoginResponse>();

      if (response.success) {
        setRequiresCaptcha(response.data.requiresCaptcha);
        setUser({
          userId: response.data.userId,
          email: response.data.email,
          fullName: response.data.fullName,
        });

        toast.success("Login realizado com sucesso!");
        router.push("/warehouses");
      }
    } catch (error) {
      console.error("Login error:", error);

      if (error instanceof HTTPError) {
        const errorMessage = error.message;
        console.log("[Login Debug] HTTPError message:", errorMessage);
        console.log("[Login Debug] Status:", error.response.status);

        // Ativa captcha se backend exigir token
        const captchaRequired = errorMessage === "Captcha token is required";

        console.log("[Login Debug] captchaRequired:", captchaRequired);
        setRequiresCaptcha(captchaRequired);
        toast.error(errorMessage || "Falha no login. Verifique suas credenciais.");
      } else {
        console.log("[Login Debug] Non-HTTPError:", error);
        toast.error("Falha no login. Verifique suas credenciais.");
      }

      resetCaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  return {
    form,
    onSubmit,
    isLoading,
    requiresCaptcha,
    captchaRef,
    onCaptchaVerify,
    onCaptchaExpire,
  };
};
