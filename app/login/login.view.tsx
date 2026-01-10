"use client";

import { UseFormReturn } from "react-hook-form";
import { LoginFormData } from "./login.schema";
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
import { Loader2, AlertCircle, CheckCircle, Info, Lock, Mail, Box } from "lucide-react";
import { cn } from "@/lib/utils";

type DebugMessage = {
  timestamp: string;
  type: 'info' | 'success' | 'error';
  message: string;
  details?: any;
};

interface LoginViewProps {
  form: UseFormReturn<LoginFormData>;
  onSubmit: (data: LoginFormData) => void;
  isLoading: boolean;
  debugMessages: DebugMessage[];
}

export const LoginView = ({ form, onSubmit, isLoading, debugMessages }: LoginViewProps) => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0A0A0A] p-4 font-sans text-neutral-200 selection:bg-blue-500/30">
      
      {/* Brand / Logo Area */}
      <div className="mb-8 flex flex-col items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-[4px] bg-blue-600 font-bold text-white shadow-[0_0_30px_-5px_rgba(37,99,235,0.5)]">
          <Box className="h-8 w-8" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight uppercase text-white">StockShift</h1>
          <div className="mt-1 flex items-center justify-center gap-2 text-[10px] font-medium uppercase tracking-widest text-neutral-500">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Sistema de Gestão
          </div>
        </div>
      </div>

      <Card className="w-full max-w-sm rounded-[4px] border border-neutral-800 bg-[#171717] shadow-xl">
        <CardHeader className="space-y-1 pb-6 pt-8 text-center">
          <CardTitle className="text-lg font-bold uppercase tracking-wide text-white">
            Acesso Restrito
          </CardTitle>
          <CardDescription className="text-xs text-neutral-500">
            Identifique-se para acessar o painel de controle
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">E-mail Corporativo</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-600 transition-colors group-focus-within:text-blue-500" />
                        <Input 
                          placeholder="usuario@empresa.com" 
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
                    <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Senha de Acesso</FormLabel>
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
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full h-11 rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-widest text-white hover:bg-blue-700 shadow-[0_0_20px_-5px_rgba(37,99,235,0.3)] transition-all active:scale-[0.98]" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Autenticando...
                  </>
                ) : (
                  "Entrar no Sistema"
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

      {/* Debug Messages - Only show if there are messages */}
      {debugMessages && debugMessages.length > 0 && (
        <div className="mt-8 w-full max-w-md rounded-[4px] border border-neutral-800 bg-[#171717] p-4 text-xs font-mono">
          <h3 className="mb-2 font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-2">
            <Info className="h-3 w-3" /> Logs do Sistema
          </h3>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
            {debugMessages.map((msg, idx) => (
              <div 
                key={idx} 
                className={cn(
                  "flex gap-2 p-2 rounded-[2px] border-l-2",
                  msg.type === 'error' && "border-rose-500 bg-rose-950/10 text-rose-400",
                  msg.type === 'success' && "border-emerald-500 bg-emerald-950/10 text-emerald-400",
                  msg.type === 'info' && "border-blue-500 bg-blue-950/10 text-blue-400"
                )}
              >
                <span className="opacity-50 text-[10px] whitespace-nowrap pt-0.5">{msg.timestamp}</span>
                <span className="break-all">{msg.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
