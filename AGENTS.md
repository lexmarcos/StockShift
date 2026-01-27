# StockShift

Frontend de gerenciamento de estoque construído com Next.js 15, TypeScript, Tailwind CSS e shadcn/ui.

## Comandos

- `pnpm dev` - Servidor de desenvolvimento
- `pnpm test` - Executar testes
- `pnpm build` - Build de produção

## Regras Universais

- **Commits em uma linha apenas**
- **Dark-Only** - Fundo `#0A0A0A`, sem suporte a light mode
- **Mobile First** - Sempre começar pelo mobile
- **MVVM obrigatório** - Toda página segue a arquitetura MVVM
- **Não criar arquivos .md** - Apenas se o usuário solicitar
- **Perguntar sobre testes** - Ao finalizar uma página, oferecer testes do model

## Instruções Detalhadas

- [Design System](.claude/design-system.md) - Paleta, tipografia, geometria
- [Arquitetura MVVM](.claude/architecture.md) - Estrutura de páginas e validação
- [Componentes](.claude/components.md) - UI, breadcrumb, responsivo
- [Data Fetching](.claude/data-fetching.md) - SWR e ky
- [Testes](.claude/testing.md) - Vitest e workflow
