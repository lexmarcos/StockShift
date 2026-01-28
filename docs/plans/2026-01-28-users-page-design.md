# Users Page Design

## Overview
Página de gerenciamento de usuários em `/system/users` com listagem e criação via modal.

## Estrutura de Arquivos
```
app/(pages)/system/users/
├── users.model.ts
├── users.view.tsx
├── users.types.ts
├── users.schema.ts
└── page.tsx
```

## Tipos
- User: id, email, fullName, isActive, mustChangePassword, lastLogin, createdAt, roles[], warehouses[]
- CreateUserPayload: email, fullName, roleIds[], warehouseIds[]
- CreateUserResponse: userId, email, fullName, temporaryPassword, roles[], warehouses[]

## Layout
- Desktop: Tabela com colunas Nome/Email, Roles, Warehouses, Status, Último Login, Ações
- Mobile: Cards com dropdown de ações
- Busca por nome/email

## Modal de Criação
- Campos: Nome, Email, Roles (multi-select), Warehouses (multi-select)
- Após sucesso: exibe senha temporária com botão copiar

## Permissões
- Apenas ADMIN pode acessar
- Verificar via contexto de autenticação
