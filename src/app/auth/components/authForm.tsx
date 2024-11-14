"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { IAuthForm, IAuthFormProps } from "./types";
import { Form, FormField, FormItem } from "@/components/ui/form";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/services/api/api";
import { useRouter } from "next/navigation";
import { ReloadIcon } from "@radix-ui/react-icons";
import { useToast } from "@/components/ui/use-toast";

export default function AuthForm({ authType }: IAuthFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<IAuthForm>({
    defaultValues: {
      password: "",
      name: "",
      email: "",
    },
  });

  const getEndpointByAuthType = (data: IAuthForm) => {
    if (authType === "signin") {
      return api.auth.signin(data);
    }
    return api.auth.signup(data);
  };

  const onSuccessSignin = (data: IResponseSignIn) => {
    localStorage.setItem("user", JSON.stringify(data.user));
    router.push("/inventories");
  };

  const onSuccessSignup = () => {
    router.push("/auth/signin");
    toast({
      color: "green",
      title: "Conta criada com sucesso",
      description: "Voce já pode fazer o login",
    });
  };

  const doActionByAuthTypeOnSucess = (data: IResponseSignIn) => {
    if (authType === "signin") return onSuccessSignin(data);
    return onSuccessSignup();
  };

  const mutation = useMutation({
    mutationFn: (data: IAuthForm) => {
      return getEndpointByAuthType(data);
    },
    onSuccess: (data: IResponseSignIn | IResponseSignup) => {
      doActionByAuthTypeOnSucess(data as IResponseSignIn);
    },
  });

  const onSubmit = (data: IAuthForm) => {
    mutation.mutate(data);
  };

  const handleSubmit = () => {
    return form.handleSubmit(onSubmit);
  };

  const renderButtonTitleByAuthType = () => {
    const titles = {
      signin: "Entrar",
      signup: "Criar conta",
    };
    return titles[authType];
  };

  const renderOnlySignupInputs = () => {
    return (
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <Label htmlFor="name">Nome completo</Label>
            <Input {...field} id="name" placeholder="Exemplo da Silva" />
          </FormItem>
        )}
      />
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit()} className="grid w-full items-center gap-1.5">
        {authType === "signup" && renderOnlySignupInputs()}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <Label htmlFor="email">Email</Label>
              <Input {...field} id="email" placeholder="nome@exemplo.com" type="email" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <Label htmlFor="password">Senha</Label>
              <Input {...field} type="password" id="password" placeholder="Senha" />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={mutation.isPending}>
          {!mutation.isPending ? (
            renderButtonTitleByAuthType()
          ) : (
            <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
          )}
        </Button>
      </form>
    </Form>
  );
}
