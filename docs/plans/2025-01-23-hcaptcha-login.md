# hCaptcha Login Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Adicionar hCaptcha condicional na tela de login, exibindo o widget apenas quando o backend retornar `requiresCaptcha: true`.

**Architecture:** O estado `requiresCaptcha` começa como `false`. Após cada tentativa de login, o valor é atualizado com base na resposta do backend. Quando `true`, o widget do hCaptcha é renderizado e o usuário deve resolver antes de tentar novamente. O token é enviado como `captchaToken` no body.

**Tech Stack:** Next.js 15, React, TypeScript, @hcaptcha/react-hcaptcha, react-hook-form, ky

---

## Task 1: Atualizar Types

**Files:**
- Modify: `app/login/login.types.ts`

**Step 1: Atualizar LoginResponse e criar LoginErrorResponse**

```typescript
import { LoginFormData } from "./login.schema";

export type { LoginFormData };

export interface LoginResponse {
  success: boolean;
  message: string | null;
  data: {
    tokenType: string;
    expiresIn: number;
    userId: string;
    email: string;
    fullName: string;
    requiresCaptcha: boolean;
  };
}

export interface LoginErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  requiresCaptcha: boolean;
}

export type DebugMessage = {
  timestamp: string;
  type: "info" | "success" | "error";
  message: string;
  details?: unknown;
};
```

**Step 2: Commit**

```bash
git add app/login/login.types.ts
git commit -m "feat(login): add requiresCaptcha to response types"
```

---

## Task 2: Atualizar Model com Lógica do Captcha

**Files:**
- Modify: `app/login/login.model.ts`

**Step 1: Adicionar imports, estados e handlers do captcha**

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginFormData } from "./login.schema";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { LoginResponse, LoginErrorResponse } from "./login.types";
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
        try {
          const errorResponse = await error.response.json() as LoginErrorResponse;
          setRequiresCaptcha(errorResponse.requiresCaptcha);
          toast.error(errorResponse.message || "Falha no login. Verifique suas credenciais.");
        } catch {
          toast.error("Falha no login. Verifique suas credenciais.");
        }
      } else {
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
```

**Step 2: Commit**

```bash
git add app/login/login.model.ts
git commit -m "feat(login): add hCaptcha logic to login model"
```

---

## Task 3: Atualizar View com Widget do Captcha

**Files:**
- Modify: `app/login/login.view.tsx`

**Step 1: Adicionar import do HCaptcha e atualizar interface**

Adicionar no topo do arquivo:
```typescript
import HCaptcha from "@hcaptcha/react-hcaptcha";
```

Atualizar a interface `LoginViewProps`:
```typescript
interface LoginViewProps {
  form: UseFormReturn<LoginFormData>;
  onSubmit: (data: LoginFormData) => void;
  isLoading: boolean;
  debugMessages: DebugMessage[];
  requiresCaptcha: boolean;
  captchaRef: React.RefObject<HCaptcha>;
  onCaptchaVerify: (token: string) => void;
  onCaptchaExpire: () => void;
}
```

Atualizar a função para receber as novas props:
```typescript
export const LoginView = ({
  form,
  onSubmit,
  isLoading,
  debugMessages,
  requiresCaptcha,
  captchaRef,
  onCaptchaVerify,
  onCaptchaExpire,
}: LoginViewProps) => {
```

**Step 2: Adicionar widget do captcha no JSX**

Entre o FormField do password e o Button, adicionar:
```tsx
{requiresCaptcha && (
  <div className="flex flex-col items-center gap-2 py-2">
    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-500">
      Verificação necessária
    </p>
    <HCaptcha
      ref={captchaRef}
      sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY!}
      onVerify={onCaptchaVerify}
      onExpire={onCaptchaExpire}
      theme="dark"
    />
  </div>
)}
```

**Step 3: Commit**

```bash
git add app/login/login.view.tsx
git commit -m "feat(login): add conditional hCaptcha widget to login view"
```

---

## Task 4: Remover debugMessages não utilizado

**Files:**
- Modify: `app/login/login.view.tsx`
- Modify: `app/login/login.model.ts` (se necessário)

**Step 1: Verificar se debugMessages está sendo usado**

O model atual não exporta `debugMessages`, mas a view espera. Remover da interface se não for usado ou adicionar array vazio no model.

Opção mais simples - tornar opcional na view:
```typescript
interface LoginViewProps {
  form: UseFormReturn<LoginFormData>;
  onSubmit: (data: LoginFormData) => void;
  isLoading: boolean;
  debugMessages?: DebugMessage[];
  requiresCaptcha: boolean;
  captchaRef: React.RefObject<HCaptcha>;
  onCaptchaVerify: (token: string) => void;
  onCaptchaExpire: () => void;
}
```

E atualizar a condição:
```tsx
{debugMessages && debugMessages.length > 0 && (
```

**Step 2: Commit**

```bash
git add app/login/login.view.tsx
git commit -m "fix(login): make debugMessages optional"
```

---

## Task 5: Testar Manualmente

**Step 1: Iniciar servidor de desenvolvimento**

```bash
pnpm dev
```

**Step 2: Testar fluxo normal**

1. Acessar `/login`
2. Verificar que captcha NÃO aparece inicialmente
3. Tentar login com credenciais inválidas 3+ vezes
4. Verificar que captcha APARECE após backend retornar `requiresCaptcha: true`
5. Resolver captcha e tentar login novamente
6. Verificar que token é enviado no payload

**Step 3: Commit final (se ajustes necessários)**

```bash
git add .
git commit -m "feat(login): complete hCaptcha integration"
```

---

## Resumo de Arquivos

| Arquivo | Ação |
|---------|------|
| `app/login/login.types.ts` | Modificar |
| `app/login/login.model.ts` | Modificar |
| `app/login/login.view.tsx` | Modificar |
| `app/login/page.tsx` | Sem mudanças |
| `app/login/login.schema.ts` | Sem mudanças |
