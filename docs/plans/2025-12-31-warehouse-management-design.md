# Warehouse Management Pages - Design Document

**Date**: 2025-12-31  
**Status**: Validated  
**Components**: Warehouse Listing + Create/Edit Modal

---

## 1. Overview

Criar duas páginas para gerenciar armazéns (warehouses):
- **Página de Listagem**: Grid de cards com warehouses, filtros, busca e ações
- **Modal de Criar/Editar**: Formulário dentro de modal para CRUD

---

## 2. Architecture (MVVM)

### Estrutura de Arquivos

```
app/warehouses/
├── warehouses.model.ts      # Lógica (SWR, states, handlers)
├── warehouses.view.tsx      # JSX puro (cards + modal)
├── warehouses.types.ts      # Interfaces TypeScript
├── warehouses.schema.ts     # Validação Zod
└── page.tsx                 # ViewModel (orquestração)
```

### Tipos Principais

```typescript
interface Warehouse {
  id: string;
  name: string;
  code: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface WarehouseFormData {
  name: string;
  code: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
}

interface SortConfig {
  key: 'name' | 'code' | 'createdAt';
  direction: 'asc' | 'desc';
}
```

---

## 3. Schema Zod (Validação)

```typescript
export const warehouseSchema = z.object({
  name: z
    .string()
    .min(2, "Nome deve ter no mínimo 2 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  code: z
    .string()
    .min(2, "Código deve ter no mínimo 2 caracteres")
    .max(20, "Código deve ter no máximo 20 caracteres")
    .regex(/^[A-Z0-9\-]+$/, "Código deve conter apenas letras maiúsculas, números e hífen"),
  description: z
    .string()
    .max(500, "Descrição deve ter no máximo 500 caracteres")
    .optional()
    .or(z.literal("")),
  address: z
    .string()
    .max(255, "Endereço deve ter no máximo 255 caracteres")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, "Formato inválido")
    .optional()
    .or(z.literal("")),
  email: z
    .string()
    .email("Email inválido")
    .optional()
    .or(z.literal("")),
  isActive: z.boolean().default(true),
});
```

---

## 4. Página de Listagem (Warehouses List)

### Layout Responsivo

- **Mobile**: 1 coluna de cards
- **Tablet**: 2 colunas
- **Desktop**: 3-4 colunas

### Header Section

- Título: "Armazéns" com ícone
- Botão "Novo Armazém" (abre modal)
- Contador: "X armazéns"

### Barra de Filtros

- **Busca**: Input de texto (nome ou código)
- **Status**: Tabs "Todos" / "Ativos" / "Inativos"
- **Ordenação**: Dropdown (Nome A-Z, Nome Z-A, Mais Recentes, Mais Antigos)

### Design do Card

**Cabeçalho:**
- Ícone de warehouse em círculo colorido
- Nome (bold)
- Badge de status (Verde: Ativo / Cinza: Inativo)

**Corpo:**
- Código em tag/pill
- Descrição (truncada com "...")
- 📍 Endereço
- 📞 Telefone
- 📧 Email

**Rodapé:**
- Botões: Editar (lápis) + Deletar (lixeira)
- Data de criação (texto pequeno)

**Estados Visuais:**
- Hover: elevação aumenta
- Inativo: opacidade reduzida

---

## 5. Modal de Criar/Editar

### Estrutura

Usa `Dialog` shadcn/ui com max-width de 2xl.

### Título Dinâmico

- Criar: "Novo Armazém"
- Editar: "Editar Armazém"

### Seções de Campos

**Seção 1: Informações Básicas**
- **Nome** (Input, obrigatório)
- **Código** (Input, obrigatório, uppercase automático, validação de unicidade ao blur)

**Seção 2: Descrição**
- **Descrição** (Textarea, opcional, max 500 caracteres com contador)

**Seção 3: Localização e Contato**
- **Endereço** (Textarea, opcional)
- **Telefone** (Input com máscara brasileira, opcional)
- **Email** (Input type="email", opcional)

**Seção 4: Status**
- **Ativo** (Switch, default true)

### Botões

- Cancelar (variant ghost)
- Salvar (variant default, com loading state)

### Comportamento no Editar

- Código fica read-only
- Pré-preenche todos os campos
- Valida nome e código como na criação

---

## 6. Data Flow (Model)

### Listagem

1. SWR busca `GET /api/warehouses`
2. Filtra por status (Todos, Ativos, Inativos)
3. Busca por nome/código (case-insensitive)
4. Ordena conforme seleção
5. Cache automático pelo SWR

### Criar

1. Validação Zod no frontend
2. Validação de código único ao blur
3. POST `/api/warehouses`
4. Mutate SWR (atualiza lista)
5. Close modal + toast sucesso

### Editar

1. Pré-popula form com warehouse
2. Código read-only
3. PUT `/api/warehouses/{id}`
4. Mutate SWR
5. Close modal + toast sucesso

### Deletar

1. AlertDialog de confirmação
2. DELETE `/api/warehouses/{id}`
3. Mutate SWR
4. Toast sucesso

---

## 7. Tratamento de Erros

### Validação

- Campo vazio → Erro inline
- Email/telefone inválido → Erro inline
- Código duplicado → Erro ao blur

### Erros da API

| Código | Cenário | Ação |
|--------|---------|------|
| 400 | Código duplicado | Toast error |
| 409 | Tem stock ativo | Modal com detalhes + sugerir desativar |
| 404 | Não encontrado | Toast error + recarrega lista |
| 500 | Erro genérico | Toast error |

### Estados de Carregamento

- Fetch lista: Skeleton cards
- Salvando: Botão desabilitado com spinner
- Deletando: Button com spinner

---

## 8. Componentes Utilizados

- `Dialog` (modal)
- `Form` + `FormField` (react-hook-form)
- `Input`, `Textarea`, `Select`
- `Switch`, `Button`, `Badge`
- `Card`, `CardContent`, `CardHeader`, `CardTitle`
- `AlertDialog` (confirmação de delete)
- Icons do `lucide`

---

## 9. Checklist de Implementação

- [ ] Tipos (warehouses.types.ts)
- [ ] Schema Zod (warehouses.schema.ts)
- [ ] Model com SWR e handlers (warehouses.model.ts)
- [ ] View com cards e modal (warehouses.view.tsx)
- [ ] Page.tsx (ViewModel)
- [ ] Testes unitários (warehouses.model.test.ts)

---

## 10. Próximos Passos

- Usar git-worktree para isolamento
- Implementar em paralelo se possível
- Escrever testes após implementação
