"use client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { useMutation } from "@tanstack/react-query";
import { api } from "../services/api/api";
import { useState } from "react";
import { useCookies } from "react-cookie";
import { useRouter } from "next/navigation";

function Login() {
  const [, setCookie] = useCookies(["token"]);
  const router = useRouter();
  const mutation = useMutation({
    mutationFn: (data: ISignIn) => {
      return api.auth.signin(data);
    },
    onSuccess: (data: IResponseSignIn) => {
      localStorage.setItem("user", JSON.stringify(data.user));
      router.push("/");
    },
  });

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = () => {
    mutation.mutate({ username, password });
  };

  return (
    <div className="grid w-full">
      <div className="p-10 flex items-center justify-center h-screen">
        <Card className="flex flex-col w-full max-w-sm items-center gap-1.5 p-6 justify-center">
          <Image
            className="relative dark:hidden mb-6"
            src="/logo-light.svg"
            alt="Next.js Logo"
            width={180}
            height={37}
            priority
          />
          <Image
            className="relative hidden dark:block mb-6"
            src="/logo-dark.svg"
            alt="Next.js Logo"
            width={180}
            height={37}
            priority
          />
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="username">Usuário</Label>
            <Input
              id="username"
              placeholder="Usuário"
              onChange={(e) => setUsername(e.target.value)}
            />
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              placeholder="Senha"
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button onClick={() => handleSubmit()} className="mt-4">
              Entrar
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default Login;
