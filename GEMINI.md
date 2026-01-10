# AGENTS.md

**Qualquer commit feito deve ser em apenas uma linha**

## 📋 Visão Geral do Projeto

Este é um projeto **frontend** construído com **Next.js 15**, **TypeScript**, **Tailwind CSS** e **shadcn/ui**.

## 🛠️ Stack Tecnológica

- **Framework**: Next.js 15
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS
- **Componentes**: shadcn/ui
- **Data Fetching**: SWR
- **HTTP Client**: ky
- **Testes**: Vitest
- **Gerenciador de Pacotes**: pnpm
- **Biblioteca de Ícones**: lucide

## 📁 Estrutura de Componentes

### Componentes UI

Utilize prioritariamente a pasta `/components/ui`. Se criar novos componentes, utilize **Tailwind CSS** e a biblioteca **lucide-react** para ícones.

### Criação de Novos Componentes
**OBRIGATÓRIO:** O design é Dark-Only (Fundo #0A0A0A). Não há necessidade de suporte ao modo light.

## 📱 Design Responsivo

**OBRIGATÓRIO: Mobile First**
1. 📱 **Mobile** (Padrão inicial)
2. 📱 **iPad/Tablet** (Ajuste de grids)
3. 💻 **Desktop** (Ajuste final em `max-w-7xl`)

## 🎨 Filosofia do Design: "Corporate Solid Dark (Vivid)"

### 1. Estética: Brutalismo Corporativo de Alto Contraste
O design une a seriedade do ambiente corporativo monocromático com o uso estratégico de **cores vivas** (Vivid Accents) para guiar o olhar do usuário e indicar funções críticas.

**Paleta de Cores:**
- **Background Principal:** `#0A0A0A` (Preto Sólido)
- **Superfícies (Cards/Modais):** `#171717` ou `neutral-900`
- **Bordas:** `#262626` ou `neutral-800`
- **Cores Vivid (Acentos):** - Primária: Blue-600 (`#2563EB`)
  - Sucesso: Emerald-600 (`#059669`)
  - Alerta: Amber-500 (`#F59E0B`)
  - Erro: Rose-600 (`#E11D48`)

### 2. Geometria e Solidez
- **Bordas (Radius):** Absolutamente fixas em **4px** para tudo (botões, inputs, cards). Evite `rounded-full` ou arredondamentos suaves.
- **Hierarquia Visual:** Use `border-l-4` com cores vivid em cards para indicar status sem precisar de textos explicativos longos.
- **Inputs:** Devem ter fundos escuros (`neutral-900`), bordas de 2px e foco com a cor primária vivid.

### 3. Comportamento e Interação
- **Sem Animações:** A interface deve ser instantânea. Não utilize transições de `hover` suaves ou `fades`. O estado de hover deve ser uma mudança abrupta de cor de fundo ou borda.
- **Tipografia:** Sans-serif (Inter ou System Sans). Títulos em **Bold**, textos de sistema em **Medium**. Use `tracking-tighter` para números e valores financeiros para passar sensação de precisão técnica.
- **Sombras:** Praticamente inexistentes. A profundidade é dada pelo contraste de cores de superfície e bordas sutis.

---

## 🛠️ Resumo para Implementação

- **Container:** Sempre `max-w-7xl mx-auto` nas páginas principais.
- **Paleta:** Fundo preto, componentes em cinza ultra-escuro, acentos em cores neon/vibrantes saturadas.
- **Botões:** Texto em caixa alta (uppercase) com `tracking-wide` para botões de ação principal.
- **Cards:** Fundo `#171717`, bordas `neutral-800`, 4px de raio.
- **Ícones:** Lucide, sempre com `stroke-width={2}` ou `2.5`.
- **Feedback:** Erros e sucessos usam cores de fundo em opacidade 10% com bordas e ícones na cor pura (Ex: `bg-rose-500/10 text-rose-500`).

## 🏗️ Arquitetura MVVM

Todas as páginas do projeto **DEVEM** seguir a arquitetura MVVM com a seguinte estrutura:

```
nome-da-pasta/
├── nome-da-pasta.model.ts    # 🧠 TODA a lógica (states, hooks, http requests) fica aqui
├── nome-da-pasta.view.tsx    # 👁️  OBRIGATORIAMENTE APENAS o JSX de visualização
├── nome-da-pasta.types.ts    # 📝 Tipos centralizados
└── page.tsx                   # 🔄 Atua como ViewModel
```

### Validação de Formulários

- Utilize **Zod** para cada formulário da página, garantindo validações declarativas.
- O schema deve ser declarado em um arquivo `nome-da-pasta.schema.ts` dentro da mesma pasta da página e importado pela model ou view quando necessário.
- Use **react-hook-form** para gerenciar o estado e a submissão de formulários, integrando-o com o schema Zod.

### Responsabilidades

- **`.model.ts`**: Contém toda a lógica de negócio, funções, hooks customizados
- **`.view.tsx`**: Apenas JSX puro para renderização
- **`.types.ts`**: Todas as interfaces e types TypeScript
- **`page.tsx`**: Orquestra model e view (ViewModel)

## 📚 Documentação de Rotas

Ao criar novas telas ou formulários que dependem de endpoints, leia o documento correspondente dentro de `docs/endpoints/` antes de implementar os hooks ou chamadas HTTP.

**Regra**: O agente só deve criar arquivos `.md` **se e somente se** for requisitado pelo usuário.

## 🌐 Requisições HTTP

### ky

Use o cliente `ky` para centralizar configuração e facilitar retries/timeouts.

```typescript
import ky from "ky";

const api = ky.create({
  prefixUrl: "/api",
  headers: { "Content-Type": "application/json" },
});

const response = await api.post("endpoint", { json: data });
```

### Data Fetching com SWR

Use **SWR** para data fetching e cache.

```typescript
import useSWR from "swr";

const { data, error, isLoading } = useSWR("/api/endpoint", fetcher);
```

## 📦 Dependências

**Assuma que todas as bibliotecas já estão instaladas**. Não é necessário verificar ou instalar pacotes.

## 🚀 Comandos

### Executar o projeto

```bash
pnpm dev
```

### Executar testes

```bash
pnpm test
```

## 🧪 Testes Unitários

### Framework

Utilize **Vitest** para testes unitários.

### Workflow

Ao finalizar a criação de uma página, **PERGUNTAR AO USUÁRIO**:

> "Deseja criar testes unitários do model desta página?"

### Escopo dos Testes

Os testes devem cobrir o arquivo **`.model.ts`** da página.

### Exemplo de Estrutura

```
nome-da-pasta/
├── nome-da-pasta.model.ts
├── nome-da-pasta.model.test.ts  # Testes aqui
├── nome-da-pasta.view.tsx
├── nome-da-pasta.types.ts
└── page.tsx
```

## ✅ Checklist para Criação de Páginas

- [ ] Estrutura MVVM completa (4 arquivos)
- [ ] Design mobile first
- [ ] Componentes suportam light/dark mode
- [ ] Requisições usando ky
- [ ] Data fetching com SWR quando aplicável
- [ ] Consultar front-instructions/ se necessário
- [ ] Perguntar sobre testes unitários ao final

## 🎯 Princípios de Desenvolvimento

1. **Sempre mobile first**
2. **Sempre MVVM**
3. **Sempre acessibilidade (light/dark)**
4. **Sempre TypeScript**
5. **Sempre consultar documentação antes de criar**
6. **Sempre oferecer testes ao final**
