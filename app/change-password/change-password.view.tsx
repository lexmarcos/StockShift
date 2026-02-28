"use client";

import { ChangePasswordViewProps } from "./change-password.types";
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
import { Box, KeyRound, Loader2, Lock, ShieldAlert } from "lucide-react";

export const ChangePasswordView = ({
  form,
  onSubmit,
  isLoading,
}: ChangePasswordViewProps) => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0A0A0A] p-4 font-sans text-neutral-200 selection:bg-blue-500/30">
      {/* Brand / Logo Area */}
      <div className="mb-8 flex flex-col items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-[4px] bg-blue-600 font-bold text-white shadow-[0_0_30px_-5px_rgba(37,99,235,0.5)]">
          <Box className="h-8 w-8" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight uppercase text-white">
            StockShift
          </h1>
          <div className="mt-1 flex items-center justify-center gap-2 text-[10px] font-medium uppercase tracking-widest text-neutral-500">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
            Ação Necessária
          </div>
        </div>
      </div>

      {/* Alert Banner */}
      <div className="mb-4 w-full max-w-sm flex items-start gap-3 rounded-[4px] border border-amber-500/30 bg-amber-500/10 px-4 py-3">
        <ShieldAlert
          className="mt-0.5 h-4 w-4 shrink-0 text-amber-500"
          strokeWidth={2}
        />
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-500">
            Senha temporária detectada
          </p>
          <p className="mt-0.5 text-[11px] text-amber-400/70">
            Por segurança, você precisa definir uma nova senha antes de
            continuar.
          </p>
        </div>
      </div>

      <Card className="w-full max-w-sm rounded-[4px] border border-neutral-800 bg-[#171717] shadow-xl">
        <CardHeader className="space-y-1 pb-6 pt-8 text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-[4px] border border-neutral-700 bg-neutral-900">
            <KeyRound className="h-5 w-5 text-blue-500" strokeWidth={2} />
          </div>
          <CardTitle className="text-lg font-bold uppercase tracking-wide text-white">
            Alterar Senha
          </CardTitle>
          <CardDescription className="text-xs text-neutral-500">
            Digite sua senha atual e defina uma nova senha de acesso
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      Senha Atual
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-600" />
                        <Input
                          type="password"
                          placeholder="••••••••"
                          className="pl-10 h-11 rounded-[4px] border-2 border-neutral-800 bg-neutral-900 text-sm text-neutral-200 placeholder:text-neutral-700 focus:border-blue-600 focus:ring-0 hover:border-neutral-700"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs text-rose-500 font-medium" />
                  </FormItem>
                )}
              />

              <div className="border-t border-neutral-800 pt-4">
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                        Nova Senha
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-600" />
                          <Input
                            type="password"
                            placeholder="Mínimo 6 caracteres"
                            className="pl-10 h-11 rounded-[4px] border-2 border-neutral-800 bg-neutral-900 text-sm text-neutral-200 placeholder:text-neutral-700 focus:border-blue-600 focus:ring-0 hover:border-neutral-700"
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
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem className="mt-5">
                      <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                        Confirmar Nova Senha
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-600" />
                          <Input
                            type="password"
                            placeholder="Repita a nova senha"
                            className="pl-10 h-11 rounded-[4px] border-2 border-neutral-800 bg-neutral-900 text-sm text-neutral-200 placeholder:text-neutral-700 focus:border-blue-600 focus:ring-0 hover:border-neutral-700"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs text-rose-500 font-medium" />
                    </FormItem>
                  )}
                />
              </div>

              <Button
                type="submit"
                className="w-full h-11 rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-widest text-white hover:bg-blue-700 shadow-[0_0_20px_-5px_rgba(37,99,235,0.3)] active:scale-[0.98]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Alterando senha...
                  </>
                ) : (
                  "Confirmar nova senha"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="mt-8 text-center">
        <p className="text-[10px] text-neutral-600 uppercase tracking-widest">
          © {new Date().getFullYear()} StockShift Inc. v1.0.0
        </p>
      </div>
    </div>
  );
};
