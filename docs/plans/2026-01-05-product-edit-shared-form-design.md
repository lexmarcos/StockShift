# Design: Edição de Produtos com Formulário Compartilhado

**Data:** 2026-01-05
**Status:** Aprovado
**Autor:** Claude + Usuário

## Visão Geral

Implementar funcionalidade de edição de produtos reutilizando o formulário de criação através de um componente compartilhado. Manter separação clara entre lógica de criação e edição, mas compartilhar a UI do formulário.

## Decisões de Design

### 1. Arquitetura
- **Abordagem:** Página separada `/products/[id]/edit`
- **Padrão:** Models separados, formulário compartilhado (opção B)
- **Redirecionamento:** Para `/products` após salvar (opção B)
- **Imagem:** Com opção de remoção (opção B)

### 2. Estrutura de Arquivos

```
app/products/
├── create/
│   ├── products-create.model.ts      # Mantém lógica de criação
│   ├── page.tsx                       # Usa ProductForm
│   └── products-create.schema.ts      # Schema compartilhado
│
├── [id]/
│   ├── edit/
│   │   ├── products-edit.model.ts    # Nova - lógica de edição
│   │   └── page.tsx                   # Nova - usa ProductForm
│   └── products-detail.*              # Mantém detalhes
│
└── components/
    ├── product-form.view.tsx          # Novo - formulário extraído
    └── product-form.types.ts          # Novo - props do formulário
```

## Componentes

### ProductForm (Novo)

Componente apresentacional que renderiza o formulário de produto.

**Props:**
```typescript
interface ProductFormProps {
  mode: 'create' | 'edit';
  onSubmit: (data: ProductCreateFormData) => void;
  isSubmitting: boolean;
  form: UseFormReturn<ProductCreateFormData>;

  // Dados auxiliares
  categories: Category[];
  isLoadingCategories: boolean;
  brands: Brand[];
  isLoadingBrands: boolean;

  // Atributos customizados
  customAttributes: CustomAttribute[];
  addCustomAttribute: () => void;
  removeCustomAttribute: (index: number) => void;
  updateCustomAttribute: (index: number, field: 'key' | 'value', value: string) => void;

  // Imagem
  productImage: File | null;
  currentImageUrl?: string;           // URL da imagem existente (edit)
  handleImageSelect: (file: File | null) => void;
  handleImageRemove?: () => void;     // Para remover imagem (edit)

  // Scanner
  openScanner: () => void;
  closeScanner: () => void;
  isScannerOpen: boolean;
  handleBarcodeScan: (barcode: string) => void;

  // Outros
  nameInputRef: React.RefObject<HTMLInputElement>;
  warehouseId: string | null;
}
```

**Diferenças entre modos:**
- **Create:** `currentImageUrl` undefined, sem botão remover, mostra campo "Modo Contínuo"
- **Edit:** `currentImageUrl` com URL, permite remover/trocar, oculta "Modo Contínuo"

### ImageDropzone (Adaptado)

**Novas props:**
```typescript
interface ImageDropzoneProps {
  onImageSelect: (file: File | null) => void;
  value: File | null;
  disabled?: boolean;
  currentImageUrl?: string;      // Nova - URL da imagem existente
  onRemoveImage?: () => void;    // Nova - callback para remover
}
```

**Lógica de exibição:**

1. **currentImageUrl existe E newImage não existe:**
   - Mostrar preview da currentImageUrl
   - Botão "Remover Imagem" (chama onRemoveImage)
   - Botão "Trocar Imagem" (abre file picker)

2. **newImage existe:**
   - Mostrar preview da newImage
   - Botão "Remover" (volta para currentImageUrl ou dropzone)

3. **currentImageUrl removida E newImage não existe:**
   - Mostrar dropzone vazio
   - Indicador "Imagem será removida ao salvar"

4. **Nenhuma imagem (create):**
   - Mostrar dropzone padrão

**Estados visuais:**
- Preview atual (cinza claro com borda)
- Preview nova (destaque sutil indicando mudança)
- Removida (indicador vermelho sutil)

## Lógica dos Models

### products-edit.model.ts (Novo)

**Responsabilidades:**
1. Fetch do produto existente via SWR
2. Pré-popular formulário com dados carregados
3. Gerenciar estado de imagem (nova + flag de remoção)
4. Submit com FormData para PUT /api/products/{id}

**Fluxo:**
```typescript
export const useProductEditModel = (productId: string) => {
  // 1. Fetch produto existente
  const { data: productData } = useSWR<ProductResponse>(
    `products/${productId}`
  );

  // 2. Form com valores vazios inicialmente
  const form = useForm({
    resolver: zodResolver(productCreateSchema),
    defaultValues: { /* vazio */ }
  });

  // 3. Quando produto carregar, popula o form
  useEffect(() => {
    if (productData?.data) {
      const product = productData.data;
      form.reset({
        name: product.name,
        description: product.description || '',
        barcode: product.barcode || '',
        // ... todos os campos
      });

      // Extrair e setar atributos customizados
      if (product.attributes) {
        const attrs = Object.entries(product.attributes)
          .filter(([k]) => k !== 'weight' && k !== 'dimensions')
          .map(([key, value]) => ({
            id: crypto.randomUUID(),
            key,
            value
          }));
        setCustomAttributes(attrs);
      }
    }
  }, [productData]);

  // 4. Estado de imagem
  const [newImage, setNewImage] = useState<File | null>(null);
  const [removeCurrentImage, setRemoveCurrentImage] = useState(false);

  const handleImageRemove = () => {
    setNewImage(null);
    setRemoveCurrentImage(true);
  };

  // 5. Submit
  const onSubmit = async (data: ProductCreateFormData) => {
    const formData = new FormData();

    const productPayload = {
      name: data.name,
      description: data.description || undefined,
      // ... todos os campos
    };

    const productBlob = new Blob([JSON.stringify(productPayload)], {
      type: 'application/json'
    });
    formData.append('product', productBlob);

    // Lógica de imagem
    if (!removeCurrentImage && newImage) {
      formData.append('image', newImage);
    }
    // Se removeCurrentImage === true e não tem newImage,
    // não envia imagem (backend deve remover)

    await api.put(`products/${productId}`, { body: formData });

    // Invalidar caches
    mutate('products');
    mutate(`products/${productId}`);

    toast.success('Produto atualizado com sucesso!');
    router.push('/products');
  };

  return {
    form,
    onSubmit,
    product: productData?.data || null,
    isLoading,
    // ... todas as props necessárias para ProductForm
    currentImageUrl: productData?.data?.imageUrl || undefined,
    handleImageRemove,
  };
};
```

### products-create.model.ts (Refatorado)

Mantém toda lógica atual, mas:
- Retorna props compatíveis com `ProductFormProps`
- Não precisa de `currentImageUrl` nem `handleImageRemove`

## Navegação e UX

### Acesso à Edição
- Botão "Editar" na página de detalhes (`/products/[id]`)
- Redireciona para `/products/[id]/edit`
- Header: "EDITAR PRODUTO" (vs "NOVO PRODUTO")

### Navegação
- **Voltar:** `/products/[id]` (página de detalhes)
- **Cancelar:** `/products/[id]` (página de detalhes)
- **Salvar com sucesso:** `/products` (lista)

### Modo Contínuo
- **Não aplicável ao edit**
- Campo `continuousMode` só renderizado quando `mode === 'create'`

## Validação e Error Handling

### Validação
- Usa schema compartilhado: `products-create.schema.ts`
- Validações idênticas para create e edit
- Validade obrigatória quando `hasExpiration: true`

### Estados de Erro
- **Loading:** Skeleton/spinner enquanto carrega produto
- **404:** "Produto não encontrado" se GET falhar
- **Submit error:** Toast com mensagem de erro
- **Validação:** Mesmos erros do create

### Success Flow
1. Toast: "Produto atualizado com sucesso!"
2. Invalidar cache SWR: `/products` e `/products/{id}`
3. Redirect para `/products`

## Endpoint Utilizado

**PUT /api/products/{id}**
- Content-Type: `multipart/form-data`
- Parts:
  - `product`: Blob JSON com `type: application/json`
  - `image`: File (opcional, se trocar/adicionar imagem)
- Omitir `image` quando `removeCurrentImage === true` para remover

## Migração

### Etapas
1. Criar `product-form.types.ts`
2. Extrair view atual para `product-form.view.tsx`
3. Adaptar `ImageDropzone` com novas props
4. Refatorar `products-create.model.ts` para compatibilidade
5. Atualizar `products/create/page.tsx` para usar `ProductForm`
6. Criar `products/[id]/edit/products-edit.model.ts`
7. Criar `products/[id]/edit/page.tsx`
8. Adicionar botão "Editar" em `products/[id]/products-detail.view.tsx`

## Checklist de Implementação

- [ ] Criar `product-form.types.ts`
- [ ] Extrair formulário para `product-form.view.tsx`
- [ ] Adaptar `ImageDropzone` (currentImageUrl, onRemoveImage)
- [ ] Refatorar `products-create.model.ts`
- [ ] Atualizar `products/create/page.tsx`
- [ ] Criar `products-edit.model.ts`
- [ ] Criar `products/[id]/edit/page.tsx`
- [ ] Adicionar botão "Editar" na página de detalhes
- [ ] Testar fluxo completo: edit → save → redirect
- [ ] Testar gestão de imagem: manter, trocar, remover

## Considerações Futuras

- Validação de conflitos (edição concorrente)
- Histórico de alterações
- Preview de mudanças antes de salvar
- Bulk edit (editar múltiplos produtos)
