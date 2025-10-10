# AGENTS.md

## 📋 Visão Geral do Projeto

Este é um projeto **frontend** construído com **Next.js 15**, **TypeScript**, **Tailwind CSS** e **shadcn/ui**.

## 🛠️ Stack Tecnológica

- **Framework**: Next.js 15
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS
- **Componentes**: shadcn/ui
- **Data Fetching**: SWR
- **HTTP Client**: Fetch API
- **Testes**: Vitest
- **Gerenciador de Pacotes**: pnpm

## 📁 Estrutura de Componentes

### Componentes UI
Todos os componentes necessários para criar telas estão disponíveis em:
```
/components/ui
```

### Criação de Novos Componentes
Ao criar novos componentes, **SEMPRE** verificar se o componente atende ao **modo light/dark**.

## 📱 Design Responsivo

**OBRIGATÓRIO: Mobile First**

A ordem de prioridade de desenvolvimento é:
1. 📱 **Mobile** (primeira prioridade)
2. 📱 **iPad** (adaptação)
3. 💻 **Desktop** (adaptação final)

As telas devem ser estruturadas inicialmente para celular e progressivamente adaptadas para telas maiores.

## 🏗️ Arquitetura MVVM

Todas as páginas do projeto **DEVEM** seguir a arquitetura MVVM com a seguinte estrutura:

```
nome-da-pasta/
├── nome-da-pasta.model.ts    # 🧠 TODA a lógica fica aqui
├── nome-da-pasta.view.tsx    # 👁️  APENAS o JSX de visualização
├── nome-da-pasta.types.ts    # 📝 Tipos centralizados
└── page.tsx                   # 🔄 Atua como ViewModel
```

### Responsabilidades

- **`.model.ts`**: Contém toda a lógica de negócio, funções, hooks customizados
- **`.view.tsx`**: Apenas JSX puro para renderização
- **`.types.ts`**: Todas as interfaces e types TypeScript
- **`page.tsx`**: Orquestra model e view (ViewModel)

## 📚 Documentação de Rotas

A pasta `front-instructions/` contém instruções sobre como usar as requisições do backend.

**⚠️ IMPORTANTE**: Se surgirem dúvidas durante a implementação, consulte o arquivo `.md` relacionado à rota da tarefa.

**Regra**: O agente só deve criar arquivos `.md` **se e somente se** for requisitado pelo usuário.

## 🌐 Requisições HTTP

### Fetch API
Use a função nativa `fetch()` para fazer requisições HTTP.

```typescript
const response = await fetch('/api/endpoint', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
```

### Data Fetching com SWR
Use **SWR** para data fetching e cache.

```typescript
import useSWR from 'swr';

const { data, error, isLoading } = useSWR('/api/endpoint', fetcher);
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
- [ ] Requisições usando fetch
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