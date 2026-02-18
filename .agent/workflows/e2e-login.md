---
description: E2E test for the login page using Chrome DevTools MCP
---

# E2E Login Test — Chrome DevTools MCP

## Pré-requisitos

1. O servidor Next.js deve estar rodando (`pnpm dev` na porta 3000)
2. O Chrome deve estar rodando com remote debugging habilitado:
   ```bash
   google-chrome --remote-debugging-port=9222
   ```
3. O Chrome DevTools MCP deve estar configurado e conectado

---

## Cenários de Teste

### Cenário 1: Validação de campos vazios

// turbo-all

1. Navegar para `http://localhost:3000/login` usando `navigate_page`
2. Tirar um snapshot da página para identificar os elementos
3. Clicar no botão "Entrar no Sistema" sem preencher os campos
4. Tirar um snapshot e verificar se as mensagens de validação aparecem:
   - "E-mail inválido" no campo de e-mail
   - "Senha é obrigatória" no campo de senha
5. Tirar screenshot para evidência

### Cenário 2: Validação de e-mail inválido

1. Navegar para `http://localhost:3000/login` usando `navigate_page` (reload)
2. Tirar snapshot para identificar os elementos
3. Preencher o campo de e-mail com "emailinvalido" usando `fill`
4. Preencher o campo de senha com "qualquersenha" usando `fill`
5. Clicar no botão "Entrar no Sistema"
6. Tirar snapshot e verificar se a mensagem "E-mail inválido" aparece
7. Tirar screenshot para evidência

### Cenário 3: Login com credenciais inválidas

1. Navegar para `http://localhost:3000/login` usando `navigate_page` (reload)
2. Tirar snapshot para identificar os elementos
3. Preencher o campo de e-mail com "usuario@teste.com" usando `fill`
4. Preencher o campo de senha com "senhaerrada123" usando `fill`
5. Clicar no botão "Entrar no Sistema"
6. Aguardar resposta do servidor (usando `wait_for` para aguardar texto de erro)
7. Verificar nos console messages (`list_console_messages`) se há erro de autenticação
8. Verificar se aparece um toast de erro
9. Tirar screenshot para evidência

### Cenário 4: Login com credenciais válidas (necessita credenciais reais)

1. Navegar para `http://localhost:3000/login` usando `navigate_page` (reload)
2. Tirar snapshot para identificar os elementos
3. Preencher o campo de e-mail com `<email_valido>` usando `fill`
4. Preencher o campo de senha com `<senha_valida>` usando `fill`
5. Clicar no botão "Entrar no Sistema"
6. Usar `wait_for` para aguardar texto que indique sucesso (ex: redirecionamento para `/warehouses`)
7. Verificar nos network requests (`list_network_requests`) se a chamada POST para `auth/login` retornou 200
8. Verificar se o usuário foi redirecionado para `/warehouses`
9. Tirar screenshot para evidência

---

## Elementos chave da página de login

| Elemento             | Descrição                              | Placeholder/Label              |
|----------------------|----------------------------------------|--------------------------------|
| Input E-mail         | Campo de e-mail corporativo            | `usuario@empresa.com`          |
| Input Senha          | Campo de senha de acesso               | `••••••••`                     |
| Botão Submit         | Botão de login                         | `Entrar no Sistema`            |
| Link Cadastro        | Link para página de registro           | `Cadastre sua empresa`         |
| HCaptcha             | Widget de captcha (exibido se necessário) | Verificação necessária      |

## Endpoints utilizados

- **POST** `/api/auth/login` — Autenticação do usuário
  - Request: `{ email, password, captchaToken? }`
  - Success (200): Redireciona para `/warehouses`
  - Error (401): Credenciais inválidas

## Como Executar

Para executar este workflow, use o comando:
```
/e2e-login
```

O assistente irá:
1. Verificar se o servidor está rodando
2. Navegar até a página de login no Chrome
3. Executar cada cenário de teste sequencialmente
4. Capturar screenshots de evidência em cada etapa
5. Reportar os resultados de cada cenário
