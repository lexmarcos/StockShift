# AGENTS.md - Guia para Agentes LLM

## 📋 Visão Geral

Este documento fornece instruções detalhadas para agentes LLM trabalharem neste projeto Next.js 15 + TypeScript.

## 🏗️ Arquitetura do Projeto

### Estrutura MVVM Obrigatória

Todas as páginas seguem a arquitetura MVVM com **5 arquivos**:

```
nome-da-pasta/
├── nome-da-pasta.model.ts    # Lógica de negócio
├── nome-da-pasta.view.tsx    # JSX de visualização
├── nome-da-pasta.schema.ts   # Validação Zod (NOVO!)
├── nome-da-pasta.types.ts    # Tipos TypeScript
└── page.tsx                   # ViewModel (orquestra model e view)
```

### Responsabilidades de Cada Arquivo

#### 1. `nome-da-pasta.schema.ts` - Validação com Zod

**SEMPRE CRIAR** este arquivo para páginas com formulários.

```typescript
import { z } from 'zod';

// Schema com validações baseadas na documentação da API
export const createProductSchema = z.object({
  name: z
    .string()
    .min(1, 'Nome do produto é obrigatório')
    .max(200, 'Nome deve ter no máximo 200 caracteres')
    .trim(),

  description: z
    .string()
    .max(2000, 'Descrição deve ter no máximo 2000 caracteres')
    .optional()
    .default(''),

  categoryId: z
    .string()
    .optional()
    .transform((val) => (val === 'none' ? undefined : val)),

  basePrice: z
    .string()
    .min(1, 'Preço base é obrigatório')
    .refine((val) => {
      const price = parseInt(val);
      return !isNaN(price) && price >= 1;
    }, 'Preço base deve ser no mínimo R$ 0,01'),

  quantity: z
    .string()
    .min(1, 'Quantidade é obrigatória')
    .refine((val) => {
      const qty = parseInt(val);
      return !isNaN(qty) && qty >= 0;
    }, 'Quantidade deve ser um número não-negativo'),

  attributes: z
    .array(
      z.object({
        definitionId: z.string().min(1, 'Selecione um atributo'),
        valueId: z.string().min(1, 'Selecione um valor'),
      })
    )
    .default([]),
});

// Tipo inferido automaticamente do schema
export type CreateProductFormData = z.infer<typeof createProductSchema>;
```

**Onde buscar regras de validação:**
- Consultar `front-instructions/[nome-da-rota].md` para regras da API
- Exemplo: `front-instructions/products.md` para produtos
- Sempre replicar as mesmas validações do backend

#### 2. `page.tsx` - ViewModel com React Hook Form

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createProductSchema, type CreateProductFormData } from './create-product.schema';

export default function CreateProductPage() {
  // Hook do model
  const { createProduct, isLoading } = useCreateProductModel();

  // React Hook Form + Zod
  const productForm = useForm<CreateProductFormData>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      name: '',
      description: '',
      categoryId: 'none',
      basePrice: '',
      quantity: '',
      attributes: [],
    },
  });

  // Submit handler usando form.handleSubmit
  const handleSubmit = productForm.handleSubmit(async (data) => {
    // data já está validado e tipado
    await createProduct(data);
  });

  // Observar mudanças em campos específicos
  const watchCategoryId = productForm.watch('categoryId');

  useEffect(() => {
    // Reagir a mudanças em campos
    if (watchCategoryId !== 'none') {
      // Fazer algo...
    }
  }, [watchCategoryId]);

  return (
    <CreateProductView
      productForm={productForm}
      onSubmit={handleSubmit}
      isLoading={isLoading}
    />
  );
}
```

#### 3. `nome-da-pasta.view.tsx` - View com Formulário

```typescript
import { UseFormReturn } from 'react-hook-form';
import { CreateProductFormData } from './create-product.schema';

interface CreateProductViewProps {
  productForm: UseFormReturn<CreateProductFormData>;
  onSubmit: () => void;
  isLoading: boolean;
}

export function CreateProductView({ productForm, onSubmit, isLoading }: CreateProductViewProps) {
  // Observar todos os valores do form
  const formData = productForm.watch();

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
      {/* Input nativo - usar register */}
      <Input
        {...productForm.register('name')}
        disabled={isLoading}
      />
      {productForm.formState.errors.name && (
        <p className="text-sm text-destructive">
          {productForm.formState.errors.name.message}
        </p>
      )}

      {/* Textarea - usar register */}
      <Textarea
        {...productForm.register('description')}
        disabled={isLoading}
      />

      {/* Select do shadcn - usar setValue */}
      <Select
        value={formData.categoryId}
        onValueChange={(value) => productForm.setValue('categoryId', value)}
      />

      {/* CurrencyInput customizado - usar setValue */}
      <CurrencyInput
        value={formData.basePrice}
        onChange={(cents) => productForm.setValue('basePrice', cents?.toString() || '')}
        disabled={isLoading}
      />

      <Button type="submit" disabled={isLoading}>
        Salvar
      </Button>
    </form>
  );
}
```

#### 4. `nome-da-pasta.model.ts` - SEM Validações Manuais

```typescript
// ❌ NÃO FAZER - Validações manuais
const validateForm = (data: CreateProductFormData): string | null => {
  if (!data.name) return 'Nome obrigatório';
  if (data.name.length > 200) return 'Nome muito longo';
  // ...
};

// ✅ FAZER - Apenas lógica de negócio
const createProduct = async (data: CreateProductFormData) => {
  // data já validado pelo zodResolver
  setIsLoading(true);

  try {
    const response = await apiClient.post('/api/v1/products', {
      name: data.name,
      basePrice: parseInt(data.basePrice), // Converter para number se necessário
      // ...
    });

    if (response.ok) {
      const product = await response.json();
      setSuccess(true);
      return product;
    }
  } catch (error) {
    setError('Erro ao criar produto');
  } finally {
    setIsLoading(false);
  }
};
```

## 🎯 Padrões de Uso

### Para Inputs Nativos (Input, Textarea)

```typescript
<Input {...form.register('fieldName')} />
```

### Para Componentes Customizados (Select, CurrencyInput, etc)

```typescript
const formData = form.watch();

<Select
  value={formData.fieldName}
  onValueChange={(value) => form.setValue('fieldName', value)}
/>
```

### Para Arrays Dinâmicos (Atributos, etc)

```typescript
const handleAdd = () => {
  const current = form.getValues('attributes');
  form.setValue('attributes', [...current, { id: '', value: '' }]);
};

const handleRemove = (index: number) => {
  const current = form.getValues('attributes');
  form.setValue('attributes', current.filter((_, i) => i !== index));
};

const handleChange = (index: number, field: string, value: string) => {
  const current = form.getValues('attributes');
  const updated = [...current];
  updated[index] = { ...updated[index], [field]: value };
  form.setValue('attributes', updated);
};
```

### Para Exibir Erros

```typescript
{form.formState.errors.fieldName && (
  <p className="text-sm text-destructive">
    {form.formState.errors.fieldName.message}
  </p>
)}
```

## 📚 Consultar Documentação de Rotas

**SEMPRE** consultar `front-instructions/` para:
1. Regras de validação da API
2. Campos obrigatórios vs opcionais
3. Tipos de dados esperados
4. Limites de caracteres
5. Formatos especiais

Exemplo de como mapear documentação para Zod:

**Da documentação (products.md):**
```markdown
| name        | string | yes      | Max 200 chars.                                 |
| basePrice   | number | yes      | Minimum `1` (stored as cents).                 |
```

**Para o schema Zod:**
```typescript
const schema = z.object({
  name: z
    .string()
    .min(1, 'Nome é obrigatório')
    .max(200, 'Nome deve ter no máximo 200 caracteres'),

  basePrice: z
    .string()
    .refine((val) => parseInt(val) >= 1, 'Preço mínimo é R$ 0,01'),
});
```

## ⚠️ Regras Importantes

1. **NUNCA** criar validações manuais no `.model.ts`
2. **SEMPRE** usar `zodResolver` para validação
3. **SEMPRE** consultar `front-instructions/` para regras
4. **SEMPRE** usar `form.handleSubmit()` para submit
5. **SEMPRE** exibir mensagens de erro do `form.formState.errors`
6. **SEMPRE** usar `z.infer<>` para inferir tipos do schema
7. **NUNCA** duplicar types - use apenas os inferidos do Zod

## 🔄 Fluxo de Trabalho

1. Ler `front-instructions/[rota].md`
2. Criar `nome-da-pasta.schema.ts` com validações Zod
3. Criar `page.tsx` com `useForm` + `zodResolver`
4. Criar `nome-da-pasta.view.tsx` recebendo `UseFormReturn`
5. Atualizar `nome-da-pasta.model.ts` (remover validações se existir)
6. Testar formulário

## 💡 Benefícios da Abordagem

1. **Type-safety completo**: Tipos inferidos do schema
2. **Única fonte de verdade**: Schema Zod define tudo
3. **Validação em tempo real**: Feedback imediato ao usuário
4. **Menos código**: Sem validações duplicadas
5. **Melhor manutenibilidade**: Mudanças centralizadas no schema
6. **Integração perfeita**: React Hook Form + Zod + TypeScript

## 📝 Exemplo Completo

Ver implementação completa em:
- `app/main/products/create/` (exemplo de referência)

---

**Última atualização**: Implementação do React Hook Form + Zod
