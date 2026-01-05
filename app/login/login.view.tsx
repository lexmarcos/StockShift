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
import { Loader2, AlertCircle, CheckCircle, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const getIcon = (type: DebugMessage['type']) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="h-4 w-4" />;
      case 'success':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getColorClasses = (type: DebugMessage['type']) => {
    switch (type) {
      case 'error':
        return 'border-red-500/50 bg-red-500/10 text-red-500';
      case 'success':
        return 'border-green-500/50 bg-green-500/10 text-green-500';
      default:
        return 'border-blue-500/50 bg-blue-500/10 text-blue-500';
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 gap-4 flex-col lg:flex-row lg:items-start lg:pt-20">
      <Card className="w-full max-w-md border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Acessar conta
          </CardTitle>
          <CardDescription>
            Entre com seu e-mail e senha para acessar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input placeholder="seu@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Entrar
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {debugMessages.length > 0 && (
        <Card className="w-full max-w-md border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg font-bold tracking-tight flex items-center gap-2">
              <Info className="h-5 w-5" />
              Debug (Safari Mobile)
            </CardTitle>
            <CardDescription className="text-xs">
              Mensagens de debug para diagnóstico em celular
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] w-full rounded-md border p-3">
              <div className="space-y-2">
                {debugMessages.map((msg, index) => (
                  <Alert key={index} className={`${getColorClasses(msg.type)} border`}>
                    <div className="flex items-start gap-2">
                      {getIcon(msg.type)}
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold">{msg.message}</p>
                          <span className="text-[10px] opacity-70">{msg.timestamp}</span>
                        </div>
                        {msg.details && (
                          <AlertDescription className="text-[10px] font-mono mt-1 opacity-80 overflow-x-auto">
                            <pre className="whitespace-pre-wrap break-all">
                              {JSON.stringify(msg.details, null, 2)}
                            </pre>
                          </AlertDescription>
                        )}
                      </div>
                    </div>
                  </Alert>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
