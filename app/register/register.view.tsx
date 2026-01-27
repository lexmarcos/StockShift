"use client";

import { UseFormReturn } from "react-hook-form";
import { RegisterFormData } from "./register.schema";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Building2, Mail, Lock, KeyRound, Box, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface RegisterViewProps {
  form: UseFormReturn<RegisterFormData>;
  onSubmit: (data: RegisterFormData) => void;
  isLoading: boolean;
}

export const RegisterView = ({
  form,
  onSubmit,
  isLoading,
}: RegisterViewProps) => {
  const password = form.watch("password");
  const hasMinLength = password?.length >= 6;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0A0A0A] p-4 font-sans text-neutral-200 selection:bg-blue-500/30">
      {/* Subtle gradient background */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-950/20 via-transparent to-transparent" />

      {/* Back to login */}
      <div className="absolute left-4 top-4 md:left-8 md:top-8">
        <Link
          href="/login"
          className="group flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-neutral-600 transition-colors hover:text-neutral-400"
        >
          <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-0.5" />
          Voltar ao Login
        </Link>
      </div>

      {/* Brand / Logo Area */}
      <div className="relative z-10 mb-8 flex flex-col items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-[4px] bg-blue-600 font-bold text-white shadow-[0_0_40px_-5px_rgba(37,99,235,0.6)]">
          <Box className="h-8 w-8" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight uppercase text-white">StockShift</h1>
          <div className="mt-1 flex items-center justify-center gap-2 text-[10px] font-medium uppercase tracking-widest text-neutral-500">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Crie sua Conta
          </div>
        </div>
      </div>

      <Card className="relative z-10 w-full max-w-md rounded-[4px] border border-neutral-800 bg-[#171717] shadow-2xl">
        {/* Decorative top accent */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

        <CardHeader className="space-y-1 pb-6 pt-8 text-center">
          <CardTitle className="text-lg font-bold uppercase tracking-wide text-white">
            Cadastro de Empresa
          </CardTitle>
          <CardDescription className="text-xs text-neutral-500">
            Preencha os dados abaixo para começar a gerenciar seu estoque
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-8">
          <Form {...form}>
            <form method="POST" onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      Nome da Empresa
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-600 transition-colors" />
                        <Input
                          placeholder="Minha Empresa Ltda"
                          className="pl-10 h-11 rounded-[4px] border-neutral-800 bg-neutral-900 text-sm text-neutral-200 placeholder:text-neutral-700 focus:border-blue-600 focus:ring-0 transition-all hover:border-neutral-700"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs text-rose-500 font-medium" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      E-mail do Administrador
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-600" />
                        <Input
                          type="email"
                          placeholder="admin@suaempresa.com"
                          className="pl-10 h-11 rounded-[4px] border-neutral-800 bg-neutral-900 text-sm text-neutral-200 placeholder:text-neutral-700 focus:border-blue-600 focus:ring-0 transition-all hover:border-neutral-700"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs text-rose-500 font-medium" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      Senha de Acesso
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-600" />
                        <Input
                          type="password"
                          placeholder="••••••••"
                          className="pl-10 h-11 rounded-[4px] border-neutral-800 bg-neutral-900 text-sm text-neutral-200 placeholder:text-neutral-700 focus:border-blue-600 focus:ring-0 transition-all hover:border-neutral-700"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs text-rose-500 font-medium" />
                    {/* Password strength indicator */}
                    <div className="mt-2 flex items-center gap-2">
                      <div className={`h-1 flex-1 rounded-full transition-colors ${hasMinLength ? 'bg-emerald-500' : 'bg-neutral-800'}`} />
                      <div className={`h-1 flex-1 rounded-full transition-colors ${password?.length >= 8 ? 'bg-emerald-500' : 'bg-neutral-800'}`} />
                      <div className={`h-1 flex-1 rounded-full transition-colors ${password?.length >= 12 ? 'bg-emerald-500' : 'bg-neutral-800'}`} />
                    </div>
                    <p className="mt-1.5 flex items-center gap-1.5 text-[10px] text-neutral-600">
                      <CheckCircle2 className={`h-3 w-3 transition-colors ${hasMinLength ? 'text-emerald-500' : 'text-neutral-700'}`} />
                      Mínimo 6 caracteres
                    </p>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      Confirmar Senha
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-600" />
                        <Input
                          type="password"
                          placeholder="••••••••"
                          className="pl-10 h-11 rounded-[4px] border-neutral-800 bg-neutral-900 text-sm text-neutral-200 placeholder:text-neutral-700 focus:border-blue-600 focus:ring-0 transition-all hover:border-neutral-700"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs text-rose-500 font-medium" />
                  </FormItem>
                )}
              />

              <div className="pt-2">
                <Button
                  type="submit"
                  className="w-full h-12 rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-widest text-white hover:bg-blue-700 shadow-[0_0_30px_-5px_rgba(37,99,235,0.4)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cadastrando...
                    </>
                  ) : (
                    "Criar Minha Empresa"
                  )}
                </Button>
              </div>

              <p className="text-center text-[10px] text-neutral-600">
                Ao criar sua conta, você concorda com nossos{" "}
                <span className="text-neutral-500 hover:text-neutral-400 cursor-pointer transition-colors">
                  Termos de Uso
                </span>{" "}
                e{" "}
                <span className="text-neutral-500 hover:text-neutral-400 cursor-pointer transition-colors">
                  Política de Privacidade
                </span>
              </p>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Already have account */}
      <div className="relative z-10 mt-6 text-center">
        <p className="text-xs text-neutral-600">
          Já possui uma conta?{" "}
          <Link href="/login" className="font-semibold text-blue-500 hover:text-blue-400 transition-colors">
            Fazer login
          </Link>
        </p>
      </div>

      <div className="relative z-10 mt-8 text-center">
        <p className="text-[10px] text-neutral-600 uppercase tracking-widest">
          © {new Date().getFullYear()} StockShift Inc. v1.0.0
        </p>
      </div>
    </div>
  );
};
