## 📱 Design Responsivo

**OBRIGATÓRIO: Mobile First**
1. 📱 **Mobile** (Padrão inicial)
2. 📱 **iPad/Tablet** (Ajuste de grids)
3. 💻 **Desktop** (Ajuste final em `max-w-7xl`)

### ⚠️ Regra para Divs Fixed Full-Width

**OBRIGATÓRIO:** Toda div com `fixed` e `full-width` (left-0 right-0) **DEVE** incluir `md:ml-[240px]` para compensar o sidebar menu.

O sidebar tem largura fixa de **240px** em desktop (variável CSS: `--sidebar-width: 240px`).

```tsx
// ✅ CORRETO
<div className="fixed bottom-0 left-0 right-0 md:ml-[240px]">
  {/* conteúdo */}
</div>

// ❌ ERRADO - Vai sobrepor o sidebar
<div className="fixed bottom-0 left-0 right-0">
  {/* conteúdo */}
</div>
```

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
- **Tipografia:** Sans-serif (Inter ou System Sans). Títulos em **Bold**. Use `tracking-tighter` para números e valores financeiros para passar sensação de precisão técnica.
- **Sombras:** Praticamente inexistentes. A profundidade é dada pelo contraste de cores de superfície e bordas sutis.

---

## 🛠️ Resumo para Implementação

- **Container:** Sempre `max-w-7xl mx-auto` nas páginas principais.
- **Paleta:** Fundo preto, componentes em cinza ultra-escuro, acentos em cores neon/vibrantes saturadas.
- **Botões:** Texto em caixa alta (uppercase) com `tracking-wide` para botões de ação principal.
- **Cards:** Fundo `#171717`, bordas `neutral-800`, 4px de raio.
- **Ícones:** Lucide, sempre com `stroke-width={2}` ou `2.5`.
- **Feedback:** Erros e sucessos usam cores de fundo em opacidade 10% com bordas e ícones na cor pura (Ex: `bg-rose-500/10 text-rose-500`).