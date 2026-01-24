# hCaptcha no Login - Design

## Resumo

Implementar hCaptcha condicional na tela de login, seguindo a lógica do backend que retorna `requiresCaptcha: true` após múltiplas tentativas do mesmo IP.

## Decisões

- **Biblioteca**: `@hcaptcha/react-hcaptcha` (oficial)
- **Comportamento**: Captcha condicional - só aparece quando backend exige
- **Envio do token**: Campo `captchaToken` no body do POST

## Fluxo

```
1. Usuário submete login
2. requiresCaptcha no estado? → NÃO → Envia normal
                              → SIM → Captcha resolvido? → NÃO → Bloqueia
                                                         → SIM → Envia com token
3. Backend responde
4. Atualiza requiresCaptcha com valor da resposta
5. Se requiresCaptcha: true → mostra widget
   Se login OK → redireciona
```

## Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `login.types.ts` | Adicionar `requiresCaptcha` em `LoginResponse.data`, criar `LoginErrorResponse` |
| `login.model.ts` | Estados, ref, handlers do captcha, lógica condicional no submit |
| `login.view.tsx` | Props do captcha, renderização condicional do widget |

## Variável de Ambiente

- `NEXT_PUBLIC_HCAPTCHA_SITE_KEY`
