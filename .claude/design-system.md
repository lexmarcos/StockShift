# Design System - Corporate Solid Dark (Vivid)

## Filosofia

Brutalismo corporativo de alto contraste. Design monocromático com cores vivas (Vivid Accents) para guiar o olhar e indicar funções críticas.

## Paleta de Cores

| Elemento | Cor | Tailwind |
|----------|-----|----------|
| Background | `#0A0A0A` | - |
| Superfícies | `#171717` | `neutral-900` |
| Bordas | `#262626` | `neutral-800` |
| Primária | `#2563EB` | `blue-600` |
| Sucesso | `#059669` | `emerald-600` |
| Alerta | `#F59E0B` | `amber-500` |
| Erro | `#E11D48` | `rose-600` |

## Geometria

- **Border Radius:** Fixo em `4px` para tudo (botões, inputs, cards). Evitar `rounded-full`
- **Hierarquia:** Usar `border-l-4` com cores vivid para indicar status
- **Inputs:** Fundo `neutral-900`, bordas 2px, foco com cor primária

## Tipografia

- Sans-serif (Inter ou System Sans)
- Títulos em **Bold**
- `tracking-tighter` para números e valores financeiros

## Comportamento

- **Sem animações** - Interface instantânea
- **Hover abrupto** - Mudança direta de cor, sem transições suaves
- **Sem sombras** - Profundidade via contraste de cores

## Implementação Rápida

```tsx
// Container
<div className="max-w-7xl mx-auto">

// Card
<div className="bg-neutral-900 border border-neutral-800 rounded">

// Botão primário
<button className="bg-blue-600 uppercase tracking-wide rounded">

// Feedback de erro
<div className="bg-rose-500/10 text-rose-500 border border-rose-500">

// Ícones
<Icon strokeWidth={2} />
```
