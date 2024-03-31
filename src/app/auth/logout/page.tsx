"use client";
import { useToast } from "@/components/ui/use-toast";
import { api } from "@/services/api/api";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Logout() {
  const { toast } = useToast();
  const router = useRouter();
  const logoutMutation = useMutation({
    mutationFn: async () => api.auth.logout(),
    onSuccess: () => {
      router.push("/auth/signin");
      toast({
        variant: "destructive",
        title: "Token Inválido",
        description: "Você está sendo deslogado...",
      });
    },
  });

  useEffect(() => {
    logoutMutation.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <h1 className="font-bold text-4xl">Saindo...</h1>
    </div>
  );
}
