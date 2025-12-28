# Design: Product Create Page Improvements

**Data**: 2025-12-28
**Status**: Approved
**Página**: `/app/products/create`

## Visão Geral

Melhorias na página de criação de produtos para atender todos os campos da API, design responsivo mobile-first com estética "Dark Premium Tech" e funcionalidades avançadas.

## 1. Arquitetura e Estrutura de Dados

### Schema e Validação

Atualizar `products-create.schema.ts`:

```typescript
attributes: z.object({
  weight: z.string().optional(),
  dimensions: z.string().optional(),
  custom: z.array(z.object({
    key: z.string().min(1, "Nome do atributo obrigatório"),
    value: z.string().min(1, "Valor obrigatório")
  })).optional()
}).optional()
```

**Remover**: `barcodeType` do schema e formulário (simplificação UX)

### State Management no Model

- **State adicional**:
  - `customAttributes: { key: string, value: string }[]`
  - `continuousMode: boolean` (para cadastro contínuo)

- **Funções**:
  - `addCustomAttribute()`: adiciona novo par vazio
  - `removeCustomAttribute(index)`: remove atributo
  - `updateCustomAttribute(index, field, value)`: atualiza key ou value
  - `toggleContinuousMode()`: ativa/desativa modo contínuo

- **Submit Logic**:
  - Mesclar atributos fixos + customizados em objeto JSON plano
  - Se `continuousMode` ON: resetar form + manter na página + preservar categoria
  - Se `continuousMode` OFF: redirecionar para `/products`

### Componente Auxiliar

**Novo componente**: `components/product/custom-attributes-builder.tsx`

Props:
- `attributes: { key: string, value: string }[]`
- `onAdd: () => void`
- `onRemove: (index: number) => void`
- `onUpdate: (index: number, field: 'key' | 'value', value: string) => void`

## 2. Design Visual e Componentes

### Estética "Dark Premium Tech" Aprimorada

**Cards com Gradientes Sutis:**
- Bordas com gradiente em hover: `hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300`
- Background com leve gradiente: `bg-gradient-to-br from-card via-card to-card/95`
- Efeito "glow" sutil nos cards ativos

**Ícones e Headers:**
- Ícones em círculos com gradiente: `bg-gradient-to-br from-blue-500 to-blue-600`
- Animação de entrada: `animate-in fade-in slide-in-from-bottom-4 duration-500`
- Cores temáticas por seção:
  - Azul: Detalhes do Produto
  - Roxo: Atributos Físicos
  - Laranja: Organização
  - Cinza: Inventário

**Custom Attributes Builder:**
- Animação entrada/saída: `animate-in slide-in-from-left`
- Mini-cards: `rounded-lg border bg-muted/50`
- Botão remover (X): visível no hover (desktop) / sempre visível (mobile)
- Botão "+ Adicionar Atributo": outline com ícone Plus
- Layout inputs: `[Key Input] [Value Input] [Remove Button]`

### Responsividade

- **Mobile**: atributos em coluna única, inputs full-width
- **Tablet**: 2 colunas no grid de atributos fixos
- **Desktop**: layout 3 colunas (main 2/3 + sidebar 1/3)

### Microinterações

- Success pulse no botão após salvar
- Skeleton loading nos selects
- Auto-focus no campo Nome após reset

## 3. Comportamento e Interação

### Gerenciamento de Atributos Customizados

**Adicionar:**
- Botão abaixo dos campos fixos (weight/dimensions)
- Novo par aparece com fade-in
- Auto-focus no primeiro input (key)
- Sem limite máximo de atributos

**Remover:**
- Botão "X" (trash icon) à direita de cada par
- Desktop: visível apenas no hover
- Mobile: sempre visível
- Sem confirmação (ação reversível)

### Validação em Tempo Real

- Campos obrigatórios: erro ao perder foco se vazio
- Keys duplicadas: "Já existe um atributo com este nome"
- Barcode: enviar sem tipo (backend define default ou infere)

### Estado de Loading

- Categorias: skeleton no select
- Submit: form desabilitado + spinner no botão
- Toast de sucesso com mensagem personalizada

### Persistência

- Não implementar auto-save
- Sem confirmação ao sair da página
- LocalStorage para preferência de `continuousMode`

## 4. Validação e Tratamento de Erros

### Campos Obrigatórios

- Apenas `name` (conforme API)
- Asterisco vermelho no label
- Mensagem: "Nome do produto é obrigatório"

### Atributos Customizados

- Se par adicionado: key e value obrigatórios
- Validar keys duplicadas
- Trim automático em keys

### Barcode

- Sem validação de formato (removido barcodeType)
- Campo opcional aceita qualquer string

### Erros da API

**Rede (Network Error):**
- Toast: "Erro de conexão. Verifique sua internet."
- Manter dados no form

**Validação 400:**
- Mapear erros para campos específicos
- Mostrar abaixo de cada campo

**Permissão 403:**
- Toast: "Você não tem permissão para criar produtos"
- Redirecionar para `/products` após 3s

**Sucesso 201:**
- **Modo Normal**: Toast "Produto criado com sucesso!" + redireciona
- **Modo Contínuo**: Toast "Produto X criado! Pronto para o próximo" + reset form

## 5. Modo "Adicionar Múltiplos Produtos"

### UI do Toggle

**Localização**: Card "Estado e Configuração" (coluna direita)

**Componente**: Switch
- Label: "Cadastro contínuo"
- Description: "Adicionar vários produtos seguidos"
- Agrupado com switches: Ativo, Controlar Validade, É um Kit

### Comportamento

**Toggle OFF (modo normal):**
```
Submit → API → Toast sucesso → Redirect /products
```

**Toggle ON (modo contínuo):**
```
Submit → API → Toast "Produto X criado! Pronto para o próximo"
→ Reset form (valores default)
→ Preservar: toggle ON + categoria selecionada
→ Auto-focus campo Nome
→ Manter na página
```

### Persistência

- Salvar preferência em `localStorage: 'productCreate:continuousMode'`
- Carregar ao montar componente
- Próxima visita já vem com última escolha

## Mudanças nos Arquivos

### `products-create.schema.ts`
- Remover `barcodeType`
- Atualizar `attributes` para suportar custom array

### `products-create.model.ts`
- Adicionar states: `customAttributes`, `continuousMode`
- Adicionar funções de gerenciamento
- Atualizar `onSubmit` para lógica condicional
- Carregar/salvar `continuousMode` do localStorage
- Mesclar atributos no submit

### `products-create.view.tsx`
- Remover select `barcodeType`
- Adicionar switch "Cadastro contínuo"
- Integrar `CustomAttributesBuilder` component
- Aplicar novos estilos (gradientes, animações)
- Melhorar responsividade

### `products-create.types.ts`
- Adicionar tipos para custom attributes

### `components/product/custom-attributes-builder.tsx` (NOVO)
- Componente reutilizável para builder
- Interface de add/remove/update pares key-value

## Princípios de Design

✅ Mobile-first
✅ MVVM architecture
✅ Dark/Light mode support
✅ Acessibilidade (labels, focus management)
✅ TypeScript strict
✅ Validação com Zod
✅ SWR para data fetching
✅ ky para HTTP requests

## Melhorias Futuras (Fora do Escopo)

- Barcode scanner integration
- Drag-and-drop para reordenar atributos
- Templates de atributos por categoria
- Upload de imagem do produto
- Duplicar produto existente
