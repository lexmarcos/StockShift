# Thumbnails de Produto — Guia do Frontend

## O que são

Thumbnails são versões redimensionadas e otimizadas da imagem original do produto,
geradas automaticamente pelo backend. O objetivo é evitar que o frontend carregue
a imagem original (que pode ter vários MB) em listas, cards e previews.

Cada produto que passou pelo processamento de imagem tem **3 tamanhos** de thumbnail,
todos em **formato JPEG** com compressão entre 80% e 85% de qualidade.

| Chave  | Largura | Sufixo do arquivo | Uso recomendado                           |
| ------ | ------- | ----------------- | ----------------------------------------- |
| `"sm"` | 150px   | `_sm.jpg`         | Listas densas, autocomplete, miniaturas   |
| `"md"` | 400px   | `_md.jpg`         | Cards de produto, grid principal          |
| `"lg"` | 800px   | `_lg.jpg`         | Modal de detalhes, preview ao selecionar  |

## Onde os thumbnails aparecem na API

**Todo endpoint que retorna `ProductResponse` inclui o campo `thumbnails`.**

### Formato da resposta

```json
{
  "success": true,
  "data": {
    "id": "76cd335f-2541-4104-a86c-c03f5e67cbe1",
    "name": "Camiseta Basic",
    "imageUrl": "https://pub-xxx.r2.dev/products/76cd335f-2541-4104-a86c-c03f5e67cbe1.webp",
    "thumbnails": {
      "sm": "https://pub-xxx.r2.dev/products/76cd335f-2541-4104-a86c-c03f5e67cbe1_sm.jpg",
      "md": "https://pub-xxx.r2.dev/products/76cd335f-2541-4104-a86c-c03f5e67cbe1_md.jpg",
      "lg": "https://pub-xxx.r2.dev/products/76cd335f-2541-4104-a86c-c03f5e67cbe1_lg.jpg"
    }
    // ... outros campos
  }
}
```

### Endpoints que retornam thumbnails

| Método | Rota                  | Thumbnails?          |
| ------ | --------------------- | -------------------- |
| GET    | `/api/products`       | Sim (lista completa) |
| GET    | `/api/products/{id}`  | Sim (detalhe)        |
| GET    | `/api/products/search?q=...` | Sim (busca)   |
| POST   | `/api/products`       | Sim (criação)        |
| PUT    | `/api/products/{id}`  | Sim (atualização)    |

## Tipo no seu código (TypeScript)

```ts
interface ProductResponse {
  id: string;
  name: string;
  imageUrl: string | null;
  thumbnails: Record<"sm" | "md" | "lg", string>;
  // ... demais campos
}
```

## Regras importantes

### 1. Thumbnails podem vir vazios

O mapa `thumbnails` é **sempre enviado**, mas pode estar vazio `{}` quando:

- O produto não tem imagem (`imageUrl` é `null`)
- O processamento de thumbnails ainda não foi executado para aquele produto
- O processamento falhou parcialmente e nenhum thumbnail foi gerado

```ts
// Sempre verifique antes de usar
const thumbUrl = product.thumbnails?.md ?? product.imageUrl ?? fallbackImage;
```

### 2. O imageUrl NÃO é substituído

O campo `imageUrl` continua sendo a **imagem original** (upload original, formato
e resolução originais). Use-o apenas quando precisar da imagem em tamanho real
(ex: zoom, download).

Os thumbnails são URLs **separadas**, armazenadas em `product.thumbnails.{sm,md,lg}`.

### 3. Formato dos thumbnails é sempre JPEG

Independente do formato original (PNG, WebP, HEIC), os thumbnails são sempre JPEG.
Isso significa que thumbnails não têm transparência — o fundo original é preenchido
com a cor de fundo padrão do encoder JPEG (preto). Se precisar de transparência,
use o `imageUrl` original.

### 4. Altura é proporcional

A largura é fixa (150, 400, 800), mas a altura mantém a proporção do aspecto
original. Não assuma altura fixa no CSS — use `object-fit` ou dimensione com
base na largura.

## Estratégia de uso recomendada

```
┌─────────────────────────────────────────────────┐
│  Lista de produtos (grid)                        │
│  ┌────────┐ ┌────────┐ ┌────────┐               │
│  │ md     │ │ md     │ │ md     │   ← 400px     │
│  │ 400px  │ │ 400px  │ │ 400px  │               │
│  └────────┘ └────────┘ └────────┘               │
├─────────────────────────────────────────────────┤
│  Lista compacta / busca / autocomplete           │
│  ┌──────┐ ┌──────┐ ┌──────┐                     │
│  │ sm   │ │ sm   │ │ sm   │     ← 150px         │
│  └──────┘ └──────┘ └──────┘                     │
├─────────────────────────────────────────────────┤
│  Modal / preview rápido                          │
│  ┌──────────────────────────┐                    │
│  │ lg                       │  ← 800px          │
│  │ 800px                    │                    │
│  └──────────────────────────┘                    │
├─────────────────────────────────────────────────┤
│  Zoom / tela cheia / download                    │
│  Usar imageUrl (original)                        │
└─────────────────────────────────────────────────┘
```

### Componente React de exemplo

```tsx
function ProductImage({ product }: { product: ProductResponse }) {
  const thumbnails = product.thumbnails ?? {};
  const fallback = product.imageUrl ?? "/placeholder.png";

  return (
    <picture>
      {/* Mobile: lista compacta usa sm */}
      <source
        media="(max-width: 480px)"
        srcSet={thumbnails.sm ?? fallback}
      />
      {/* Tablet/desktop: grid usa md */}
      <source
        media="(max-width: 1024px)"
        srcSet={thumbnails.md ?? fallback}
      />
      {/* Preview/expanded: lg */}
      <img
        src={thumbnails.md ?? fallback}
        alt={product.name}
        loading="lazy"
        style={{ objectFit: "cover", aspectRatio: "1" }}
      />
    </picture>
  );
}
```

### Componente Vue de exemplo

```vue
<template>
  <img
    :src="src"
    :alt="product.name"
    loading="lazy"
    :style="{ objectFit: 'cover', aspectRatio: '1' }"
  />
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  product: Object,
  size: { type: String, default: "md", validator: (v) => ["sm", "md", "lg"].includes(v) },
});

const src = computed(() => {
  return props.product.thumbnails?.[props.size]
      ?? props.product.imageUrl
      ?? "/placeholder.png";
});
</script>
```

## Como gerar thumbnails para produtos existentes

Se produtos antigos estão sem thumbnails (mapa vazio), o admin precisa executar
o job de processamento. Veja [endpoints/admin.md](endpoints/admin.md) ou chame:

```bash
# Processar TODOS os produtos do tenant
curl -X POST "https://api.stockshift.com.br/api/admin/products/process-images" \
  -H "Authorization: Bearer <admin-token>"

# Processar um produto específico
curl -X POST "https://api.stockshift.com.br/api/admin/products/process-images?productId=<uuid>" \
  -H "Authorization: Bearer <admin-token>"
```

> **Nota:** O endpoint requer a permissão `products:update`. O processamento é
> assíncrono do ponto de vista do usuário — a resposta HTTP retorna o resultado
> completo (total, processados, falhas, etc.).

## FAQ

**P: Posso assumir que `thumbnails.sm` sempre existe?**
R: Não. Trate como opcional. Use `imageUrl` como fallback.

**P: Por que o thumbnails veio `{}` mesmo o produto tendo `imageUrl`?**
R: O processamento ainda não foi executado para esse produto, ou falhou.
Peça para o admin rodar o job de processamento.

**P: Posso usar os thumbnails como `src` direto em `<img>`?**
R: Sim! São URLs públicas do R2, acessíveis diretamente sem autenticação.

**P: Os thumbnails têm CORS configurado?**
R: Sim, o bucket R2 (`pub-*.r2.dev`) permite acesso cross-origin.
Se estiver usando CDN próprio, verifique a config de CORS lá.

**P: O que acontece se eu chamar `process-images` múltiplas vezes?**
R: É idempotente. Produtos que já têm thumbnails válidos e original ≤ 700KB
são pulados automaticamente (contados como `skipped`).
