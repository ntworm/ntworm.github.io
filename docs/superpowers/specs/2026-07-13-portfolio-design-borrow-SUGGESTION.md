# Portfolio design borrow — SUGESTÃO (não plano)

**Data:** 2026-07-13
**Status:** SUGESTÃO. Documento de referência. **Não é plano de execução.**
**Owner:** Gabriel Worm
**Origem:** análise read-only de 4 sites externos — cobloc.archi, thewatch.60fps.fr, bymonolog.com, patchwright.live.
**Escopo da sugestão:** melhorias de design no `/index` do portfolio (Gabriel Worm, Palmas/TO).

---

## ⚠️ AVISO IMPORTANTE

Este documento é uma **sugestão de implementação**, não um commitment.

- Nada aqui foi aprovado para virar branch, issue, ou trabalho.
- Nada aqui autoriza alterações em arquivos `modified` ou `untracked` do worktree atual (ver lista abaixo).
- Cada bloco tem um checkbox `[ ]` que **precisa ser marcado por você** antes de virar trabalho real.

**Files modificados/untracked em aberto — NÃO TOCAR sem alinhamento explícito:**

```
M site/src/components/Tile.astro
M site/src/content.config.ts
M site/src/data/asset-dimensions.json
M site/src/layouts/Layout.astro
M site/src/pages/about.astro
M site/src/pages/code.astro
M site/src/pages/contact.astro
M site/src/pages/index.astro
M site/src/styles/global.css
?? site/public/work/code/
?? site/src/components/GaussianBackground.astro
?? site/src/components/GaussianViewer.astro
```

**Único output garantido desta entrega atual:** este arquivo de spec. Depois disso, paro e pergunto.

---

## Contexto

Comparação read-only dos 4 sites externos com o estado atual do portfolio (`site/src/pages/index.astro`, `site/src/styles/global.css`).

### O que os 4 sites têm em comum

1. **Paleta extrema** — dark OU cream, sem meio-termo. Portfolio já está dark, fica lá.
2. **Protagonista único no hero** — nunca um hero "típico" com foto+cta+subtítulo. Sempre um objeto/elemento que respira o trabalho do dono.
3. **Manifesto em texto grande** — statement, não slogan.
4. **Micro-info técnica no canto** — coordenadas XY, status de captação, números discretos.
5. **Disposição de imagens/texturas por onde o mouse passa** — interatividade pervasiva, não集中ada no hero.

### Estado atual do portfolio (jul/2026)

- Hero: portrait à direita + H1 "Gabriel Worm" + tagline + portrait. **Já tem** reveal-mask nos H2 de seção, scroll-progress, scanlines, gaussian background, ambient surface.
- Falta: micro-info técnica, reatividade pervasiva, fechamento circular (loop).

---

## 3 sugestões concretas

Cada uma é **independente** e pode ser aprovada/rejeitada sozinha.

### [ ] Sugestão 1 — Coordenadas XY no hero (referência: Cobloc)

**O quê:** um elemento mono no canto inferior do hero que mostra `X:1234 / Y:567` em tempo real seguindo o mouse. Some em mobile (`< 720px`). Some quando `prefers-reduced-motion: reduce`.

**Por quê Cobloc:** eles usam "X:0 / Y:0" como assinatura visual. Para um portfolio de **Sound Director** (dailies, captação, números técnicos), coordenadas de leitura casam com a identidade.

**Implementação (resumo):**
- 1 novo arquivo `site/src/scripts/cursor-xy.ts` (~30 linhas, rAF + listener mousemove)
- 1 novo elemento HTML no hero de `index.astro` (1 linha)
- ~20 linhas CSS no `global.css` (classe `.hero__xy`, vars `--mouse-x --mouse-y`)
- Hook via `Layout.astro` (já importa `scroll-fade.ts` + `scroll-progress.ts`, padrão)

**Acceptance binária (verificável via Playwright):**
- `getComputedStyle(document.documentElement).getPropertyValue('--mouse-x')` muda após `page.mouse.move()`
- Valor inicial em `(0,0)` antes do primeiro movimento
- `@media (max-width: 720px)` → elemento com `display: none`
- `@media (prefers-reduced-motion: reduce)` → elemento com `display: none`

**Risco:** baixo. Arquivo novo + 1 classe nova. Não toca arquivos modified.

---

### [ ] Sugestão 2 — Disposição reativa por onde passa (referência: Cobloc + ByMonolog)

**O quê:** quebrar o H1 do hero ("Gabriel Worm") e a tagline em `<span>` por palavra. Cada span responde à proximidade do mouse com leve aumento de luminosidade/scale (≤5%). Pura CSS via `:hover` propagado ou JS que mede distância.

**Por quê:** Cobloc "disposition d'images selon où on passe". ByMonolog tem hover states por palavra. Portfolio tem reveal-mask nos H2 mas **não tem** reatividade no H1.

**Implementação (resumo):**
- Refatorar o H1/tagline do hero para usar `<span class="word">` por palavra (~10 palavras no H1, ~20 na tagline)
- 2 opções de reatividade:
  - **A) CSS puro** (`:hover` propaga brilho ao span pai) — zero JS, mas reatividade só "palavra sob cursor"
  - **B) JS com distance field** (cada span calcula distância do cursor e ganha `data-proximity` 0..1) — mais polido, ~40 linhas
- Sugestão: começar com A (rápido, sem risco). B se você aprovar depois.

**Acceptance binária:**
- Cada palavra do H1 é um `<span>` independente (verificável com `document.querySelectorAll('.hero__title .word').length === 2`)
- Hover em span → cor muda para amber OU opacity lift
- Mobile (`< 720px`) → span sem hover-state (touch não tem cursor)
- `prefers-reduced-motion: reduce` → sem transition

**Risco:** médio. Toca em `index.astro` (já modified) e `global.css`. **Requer alinhamento explícito seu pra rodar.**

---

### [ ] Sugestão 3 — Fechamento circular: volta do rodapé ecoa o hero (referência: geral)

**O quê:** ao chegar no fim do `/index`, o último bloco da página (footer ou Work section) faz **transição visual de volta ao hero** — pequeno indicador de que a página é um loop. Pode ser:
- (A) Um pequeno link "↑ Gabriel Worm" no canto do footer que rola suave ao topo
- (B) Um "ghost H1" no footer com o mesmo font-size do hero, em opacity baixa, ecoando o nome
- (C) Animação de scanline que volta a subir quando você passa do fim (referência: thewatch)

**Por quê:** portfolio pessoal longo (17 cases + about + contact) precisa de uma "volta pra casa" visual. A frase que você falou ("dá pra ficar escrodando infinitamente") sugere isso.

**Implementação (resumo):**
- (A) é 5 linhas no `Footer.astro` — já existe, fácil
- (B) é ~15 linhas no `index.astro` (entre última work section e o footer) — depende de onde o Footer renderiza
- (C) é ~10 linhas CSS + rAF — mais experimental

**Acceptance binária:**
- Após implementar (A): existe `<a class="hero-loop" href="#hero">` no footer (ou similar), clicável, scroll suave até `id="hero-title"`
- Implementação (B/C) é **opt-in**, requer aprovação separada

**Risco:** baixo se for (A). Médio se (B) porque adiciona markup novo no `index.astro`.

---

## O que NÃO está aqui (decisões)

- **Cursor custom** — você disse explicitamente que não gosta. Tirado.
- **Manifesto global** — portfolio já tem H1 forte, não precisa virar monólogo.
- **Awards/press strip** — irrelevante para portfolio pessoal.
- **3D hero** (tipo TheWatch) — alto risco, alto custo, **opcional e fora de escopo**.
- **Texture grid 3D** (tipo Cobloc) — alto risco, **opcional e fora de escopo**.

---

## Próximo passo (decisão sua)

Aprovar/rejeitar cada bloco individualmente:

```
[ ] 1 — Coordenadas XY (Cobloc)
[ ] 2 — Disposição reativa por palavra (Cobloc + Monolog)
[ ] 3 — Fechamento circular (geral)
```

Após marcar, eu:
1. Faço commit isolado deste spec (`docs: portfolio design borrow suggestion`)
2. Espero sua autorização explícita antes de qualquer implementação
3. **Não toco nos 9 modified + 3 untracked** sem alinhamento

Se rejeitar tudo: este spec vira registro histórico e o trabalho atual (9 modified) segue como prioridade.