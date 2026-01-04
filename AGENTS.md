# AGENTS.md

Use a skill frontend-design para criação de telas
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

Você pode criar novos componentes APENAS se os componentes da pasta `/components/ui` não servirem ao que você quer.

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

## 🎨 Filosofia do Design: "Corporate Solid Dark"

## Tamanho do container main
Todos os containers main de todas as páginas devem ter max-w-7xl

### 1. Estética e Vertente

O design segue a vertente **Professional Dark Interface** voltada para ambientes corporativos sérios. Trata-se de uma interface monocromática em escala de cinza sobre fundo escuro, sem uso de cores vibrantes. O objetivo é transmitir seriedade, profissionalismo e foco absoluto nas operações de estoque.

**Paleta de Cores:**
- Base totalmente em escala de cinza (preto, cinza escuro, cinza médio, cinza claro, branco)
- Botões e elementos interativos destacados através de contraste de tons de cinza
- Formulários com fundos em tons de cinza diferenciados do background principal
- Ausência de cores saturadas ou gradientes coloridos

### 2. Hierarquia e Solidez

- **Camadas (Layering):** Utilize diferentes tons de cinza para separar o fundo dos componentes. O fundo principal é o tom mais escuro; cards e formulários usam cinzas ligeiramente mais claros para definir áreas de conteúdo.
- **Bordas Controladas:** Arredondamento máximo de **4px** em todos os elementos (botões, cards, inputs). Isso mantém a interface profissional sem excessos de suavização.
- **Contraste Direto:** O design evita sombras exageradas. A hierarquia visual é criada através de diferenças de tons de cinza entre background e elementos, não através de efeitos de profundidade.

### 3. Solidez e Estabilidade

- **Sem Animações:** A interface é estática e sólida. Não utilize transições, animações ou efeitos de movimento que possam distrair do trabalho operacional.
- **Sombras Mínimas:** Quando absolutamente necessário, utilize sombras sutis e discretas apenas para separação de camadas, sempre em tons de preto com baixa opacidade (máximo 10-15%).
- **Tipografia Firme:** Fontes sans-serif com peso adequado para garantir legibilidade e transmitir solidez.

## 🧠 Sensações e Comportamento

> **A ideia central é: "Sistema de Gestão Corporativo Profissional".**

- **Seriedade Operacional:** O design deve transmitir que é uma ferramenta de trabalho séria para gestão empresarial. Nada de elementos lúdicos ou decorativos.
- **Clareza Funcional:** Cada elemento tem uma função clara. O espaço é organizado de forma lógica e previsível, priorizando eficiência sobre estética elaborada.
- **Consistência Absoluta:** Todos os componentes seguem o mesmo padrão visual monocromático. A repetição de padrões cria familiaridade e acelera o aprendizado do sistema.

---

## 🛠️ Resumo para Implementação

- **Paleta:** Escala de cinza completa - do preto (#000000) ao branco (#FFFFFF), sem cores
- **Layout:** Grid modular baseado em cards com fundo em tons de cinza diferenciados
- **Bordas:** Arredondamento máximo de 4px em todos os elementos
- **Interação:** Botões com estados claros usando variação de tons de cinza (hover através de clareamento/escurecimento)
- **Sombras:** Mínimas e discretas, apenas quando essencial para separação de camadas
- **Animações:** Nenhuma - interface estática e sólida
- **Ícones:** Lucide com estilo outline em tons de cinza ou branco para contraste
- **Formulários:** Fundos em cinza médio sobre background cinza escuro, bordas sutis em cinza claro
- **Tipografia:** Sans-serif limpa e legível, hierarquia através de peso e tamanho

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
