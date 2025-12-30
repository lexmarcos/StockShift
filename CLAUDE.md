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

Você pode criar novos componentes APENAS se os componentes da pasta `/components/ui` não servir ao que você quer.

Para ícones utilize a biblioteca **lucide** para manter consistência visual em todos os componentes.

### Criação de Novos Componentes

Ao criar novos componentes, **SEMPRE** verificar se o componente atende ao **modo light/dark**.

## 📱 Design Responsivo

**OBRIGATÓRIO: Mobile First**

A ordem de prioridade de desenvolvimento é:

1. 📱 **Mobile** (primeira prioridade)
2. 📱 **iPad** (adaptação)
3. 💻 **Desktop** (adaptação final)

As telas devem ser estruturadas inicialmente para celular e progressivamente adaptadas para telas maiores.

## 🎨 Filosofia do Design: "Dark Premium Tech"

### 1. Estética e Vertente

O design segue a vertente **Modern Dark UI**. Não se trata apenas de "fundo preto", mas de uma construção de camadas sobre tons de carvão e azul profundo. O objetivo é reduzir a fadiga ocular enquanto destaca informações críticas com cores vibrantes.

### 2. Hierarquia e Profundidade

- **Camadas (Layering):** Utilize diferentes tons de cinza muito escuros para separar o fundo das "cartas" (cards). O fundo é o nível mais profundo; os cards são ligeiramente mais claros para dar a sensação de flutuação.
- **Bordas Arredondadas (Softness):** O design evita ângulos retos. Tudo (botões, cards, inputs) possui bordas arredondadas generosas, transmitindo uma sensação de modernidade e acessibilidade.
- **Sutileza:** O uso de sombras é extremamente discreto, preferindo o contraste de cores de fundo para definir limites.

## 🧠 Sensações e Comportamento

> **A ideia central é: "Centro de Comando de Alta Precisão".**

- **Foco e Clareza:** O design deve passar a sensação de controle total e organização. O espaço negativo (respiro) é fundamental para que o usuário não se sinta sobrecarregado, mesmo com muitos dados.
- **Elegância Tecnológica:** A interface deve parecer um software premium ou uma ferramenta elite. É minimalista, mas não simplista.
- **Dinamismo Discreto:** Elementos como gráficos de barras com gradientes suaves e ícones dentro de círculos coloridos dão vida à página sem distrair do conteúdo principal.

---

## 🛠️ Resumo para Implementação

- **Layout:** Grid modular baseado em cards independentes.
- **Interação:** Botões com estados claros (hover sutil) e tipografia sans-serif limpa.
- **Visual:** Ícones de linha fina (outline) ou preenchidos com cores sólidas em fundos de baixo contraste.
- **Gráficos:** Devem usar gradientes verticais (da cor de acento para transparente) para integrar-se ao tema escuro.

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
