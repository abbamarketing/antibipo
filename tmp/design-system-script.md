# AntiBipo — Design System Script
## Prompt de Implementação de Design

Use este documento como referência para aplicar o estilo visual do AntiBipo em qualquer projeto. Cole-o como contexto para a IA ou use como guia manual.

---

## 1. IDENTIDADE VISUAL: "Concrete & Cumaru"

**Conceito:** Arquitetura brutalista brasileira — concreto aparente, gesso branco e madeira Cumaru. Minimalista, funcional, sem decoração supérflua. O design transmite **estabilidade e clareza**, não excitação.

**Tom de voz:** Neutro e factual. Sem emojis. Sem mensagens motivacionais, punitivas ou "fofas". Linguagem direta, como um painel de controle industrial.

---

## 2. PALETA DE CORES (HSL)

Todas as cores são definidas como tokens CSS HSL em `:root` e `.dark`.

### Light Mode (Dia)
```css
:root {
  --background: 0 0% 94%;        /* #F0F0F0 — Concreto Pálido */
  --foreground: 0 0% 13%;        /* #222222 — Preto Ferragem */
  --card: 0 0% 100%;             /* #FFFFFF — Gesso Branco */
  --card-foreground: 0 0% 13%;
  --primary: 22 46% 44%;         /* #B06133 — Madeira Cumaru */
  --primary-foreground: 0 0% 100%;
  --secondary: 0 0% 90%;         /* Concreto claro */
  --secondary-foreground: 0 0% 13%;
  --muted: 0 0% 92%;
  --muted-foreground: 0 0% 45%;
  --accent: 22 46% 44%;          /* Mesmo Cumaru */
  --accent-foreground: 0 0% 100%;
  --destructive: 0 65% 51%;
  --destructive-foreground: 0 0% 100%;
  --border: 0 0% 85%;
  --input: 0 0% 85%;
  --ring: 22 46% 44%;
  --radius: 0.375rem;
}
```

### Dark Mode (Noite — ativado automaticamente após 19h)
```css
.dark {
  --background: 0 0% 20%;        /* #333333 */
  --foreground: 0 0% 94%;        /* #F0F0F0 */
  --card: 0 0% 16%;
  --primary: 22 46% 50%;         /* Cumaru mais claro no escuro */
  --secondary: 0 0% 24%;
  --muted: 0 0% 24%;
  --muted-foreground: 0 0% 60%;
  --border: 0 0% 28%;
  --input: 0 0% 28%;
}
```

### Cores Semânticas Especiais
```css
/* Estados de energia */
--energy-foco: 22 46% 44%;      /* Cumaru — foco total */
--energy-leve: 43 60% 55%;      /* Âmbar quente — modo leve */
--energy-basico: 0 0% 60%;      /* Cinza neutro — só o básico */

/* Filas de prioridade */
--queue-red: 0 65% 51%;          /* Urgente */
--queue-yellow: 43 90% 55%;      /* Atenção */
--queue-green: 145 40% 45%;      /* OK / concluído */
```

### Regras de Cor
- **NUNCA** usar cores diretamente nos componentes (ex: `text-white`, `bg-black`)
- **SEMPRE** usar tokens semânticos: `bg-background`, `text-foreground`, `bg-primary`, `text-muted-foreground`
- Cores no Tailwind config mapeiam HSL via `hsl(var(--token))`
- Ambos os modos (light/dark) devem ter contraste adequado

---

## 3. TIPOGRAFIA

### Fontes
```
Display / Labels / UI:  'Roboto Mono', monospace  → var(--font-mono)
Body / Texto corrido:   'Lato', sans-serif        → var(--font-body)
```

### Regras de Aplicação
| Elemento | Fonte | Peso | Tamanho |
|----------|-------|------|---------|
| h1–h6, títulos de seção | Roboto Mono | 600–700 | text-lg a text-2xl |
| Botões, labels, nav | Roboto Mono | 500 | text-xs tracking-wider |
| Dados, timestamps, badges | Roboto Mono | 400 | text-[10px] a text-xs |
| Parágrafos, descrições | Lato | 400 | text-sm a text-base |
| Texto secundário | Lato | 300 | text-sm text-muted-foreground |

### CSS Base
```css
body { font-family: var(--font-body); }
h1, h2, h3, h4, h5, h6, button, label, nav, [data-ui-label] {
  font-family: var(--font-mono);
}
input, select, textarea { font-size: 16px !important; } /* Previne zoom iOS */
```

---

## 4. ÍCONES

- **Biblioteca exclusiva:** Lucide React (`lucide-react`)
- **Tamanhos padrão:** `w-3.5 h-3.5` (inline), `w-4 h-4` (botões), `w-5 h-5` (headers)
- **ZERO emojis** em qualquer lugar do app
- Ícones herdam a cor do texto pai (nunca hardcode cor)

---

## 5. LAYOUT E ESPAÇAMENTO

### Container Principal
```
max-width: 32rem (max-w-lg)
margin: 0 auto
padding: 1rem horizontal, 1rem vertical
padding-bottom: 6rem (espaço para FAB)
```

### Cards
```
border-radius: var(--radius) → 0.375rem (rounded-lg)
border: 1px solid hsl(var(--border))
background: hsl(var(--card))
shadow: shadow-sm (sutil)
padding: 1.5rem (p-6)
```

### Espaçamento Vertical
- Entre seções: `mb-6`
- Entre cards: `mb-4`
- Entre elementos internos: `space-y-2` a `space-y-4`
- Gap em flex/grid: `gap-1` a `gap-3`

### Responsividade
- Mobile-first (max-w-lg garante layout single-column)
- Labels curtos: `hidden sm:inline` para texto em telas pequenas
- Inputs: `font-size: 16px` forçado para prevenir zoom no iOS

---

## 6. COMPONENTES

### Botões
```
Primário:    bg-primary text-primary-foreground hover:bg-primary/90
Secundário:  bg-secondary text-secondary-foreground hover:bg-secondary/80
Ghost:       hover:bg-accent hover:text-accent-foreground
Outline:     border border-input bg-background hover:bg-accent
Destrutivo:  bg-destructive text-destructive-foreground
```
- Altura padrão: `h-10 px-4 py-2`
- Altura compacta: `h-9 px-3`
- Ícone: `h-10 w-10`
- Font: Roboto Mono, text-sm, font-medium

### FAB (Floating Action Button)
```
fixed bottom-6 right-6
w-14 h-14 rounded-full
bg-primary text-primary-foreground
shadow-lg z-40
```

### Navegação por Módulos (Tabs)
```
Container: flex gap-1 bg-secondary rounded-lg p-1
Tab ativa:  bg-card text-foreground shadow-sm rounded-md
Tab inativa: text-muted-foreground hover:text-foreground
Font: font-mono text-xs font-medium tracking-wider
```

### Badges/Tags
```
Tamanho: text-[10px] font-mono tracking-widest
Cor: text-muted-foreground (padrão) ou text-primary (destaque)
```

### Header
```
Data: text-[10px] text-muted-foreground font-mono tracking-widest
Ícones nav: p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary
```

---

## 7. ANIMAÇÕES

### Keyframes Disponíveis
```css
fade-in:  opacity 0→1, translateY 8px→0, 0.3s ease-out
slide-up: opacity 0→1, translateY 16px→0, 0.4s ease-out
accordion-down/up: height transition, 0.2s ease-out
```

### Regras
- Animações são **sutis e funcionais**, não decorativas
- Transições padrão: `transition-colors`, `transition-opacity`
- Sem animações de entrada em lista (apenas em modais/overlays)
- Sem bouncing, spinning ou efeitos chamativos

---

## 8. DARK MODE

- Ativação automática via classe `.dark` no `<html>` (baseado em horário de Brasília, após 19h)
- Não é toggle manual — é contextual ao momento do dia
- Cores de fundo escurecem, texto clareia, primary fica levemente mais brilhante
- Cards ficam `0 0% 16%` (cinza escuro, não preto puro)

---

## 9. PROMPT PARA IA

Use este prompt ao pedir para uma IA implementar o design:

```
Implemente usando a estética "Concrete & Cumaru":
- Paleta monocromática de cinzas (concreto) com acentos em tom madeira Cumaru (HSL 22 46% 44%)
- Fontes: Roboto Mono para UI/labels, Lato para corpo de texto
- Ícones: apenas Lucide React, sem emojis
- Layout mobile-first, max-w-lg centralizado
- Cards com border sutil, shadow-sm, rounded-lg
- Use APENAS tokens semânticos do design system (bg-background, text-foreground, bg-primary, etc)
- NUNCA use cores hardcoded (text-white, bg-gray-100, etc)
- Tom de voz neutro e factual, sem motivacionalismo
- Dark mode automático (classe .dark) com cinzas mais escuros e primary levemente mais claro
- Animações mínimas: apenas fade-in e slide-up quando necessário
- Inputs com font-size 16px para prevenir zoom iOS
```

---

## 10. CHECKLIST DE IMPLEMENTAÇÃO

- [ ] Importar Google Fonts: Roboto Mono (400-700) + Lato (300, 400, 700)
- [ ] Definir variáveis CSS HSL em `:root` e `.dark`
- [ ] Mapear cores no tailwind.config via `hsl(var(--token))`
- [ ] Configurar fontFamily no tailwind.config (mono + body)
- [ ] Aplicar font-family base no CSS global
- [ ] Usar apenas `lucide-react` para ícones
- [ ] Testar contraste em ambos os modos (light/dark)
- [ ] Verificar font-size 16px em inputs (iOS)
- [ ] Garantir que nenhum componente usa cores hardcoded
