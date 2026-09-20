# BenYan AI — Design System

**研习 · BenYan AI** is an AI courses & enterprise-training brand. This design system powers the brand's slide decks (PPT), handouts, web pages, case cards (案例卡片) and workshop materials for courses such as 《AI 洞察及应用》《AI 研发体系建设》《企业 AI 应用场景设计》.

**Design intent:** professional, clear, modern, with a credible sense of *tech* — but deliberately **not** cyber-flashy. The system favors structured expression, an enterprise-consulting feel, a methodology mindset, and the visual signals of real-world, battle-tested practice (实战可信度).

> **Source material:** a single brand-concept sheet — `uploads/ChatGPT Image 2026年6月11日 19_28_55.png` ("Logo Concept 4 — Forward motion. Transformation. Intelligent workflow."). Logo lockup, mark, app icon, the 4-color palette and the Inter/Manrope type direction are all extracted from it. There was no codebase or Figma file. Bilingual (中文 + English) is a first-class requirement.

---

## Content fundamentals — voice & tone

The brand speaks to **enterprise teams and managers** in mainland-China business Chinese, with English used for structural labels and Western brand terms.

- **Bilingual rhythm.** Chinese carries the meaning; English appears as kickers/labels, often joined by a middot: `方法论 · Methodology`, `实战案例 · Case Study`, `Module 03`. Course/section titles are Chinese; KPI labels and framework names may be either.
- **Voice: we, advising you.** Addresses the audience directly ("把方法论变成你的工作流" / "为团队设计一条 AI 落地路径"). Confident and consultative, never hypey. Avoids superlatives and exclamation marks.
- **Structured & outcome-led.** Copy is organized into frameworks, numbered steps and judged criteria ("识别高价值场景的三个判据", "AI 场景落地四步法"). Claims are backed by metrics (`+38% 审核效率`, `4.2× ROI`, `12 周交付`).
- **Casing.** Chinese has no case; English eyebrows are UPPERCASE with wide tracking. Headings use sentence-style, not title-case. Mono is used for codes, KPIs and technical labels (`C-02`, `70 / 20 / 10`).
- **No emoji.** None in product surfaces. Iconography is geometric, not playful. Unicode arrows (`→ ↑ ↓ ✓ ×`) act as functional micro-icons.
- **Vibe:** "consulting deck meets engineering rigor." Calm authority. Lots of whitespace, one idea per block.

**Good:**
> 先识别高价值、低风险的场景，再进入规模化落地。

**Avoid:**
> 🚀 用 AI 颠覆你的业务！立即革命性升级！！！

---

## Visual foundations

**Color.** Four brand colors anchor everything: **Ink `#1F2933`** (charcoal-navy), **Emerald `#0D8B76`** (primary brand green), **Mint `#D7F3EC`** (soft accent) and **Paper `#F7FAF8`** (near-white ground). Each is expanded into a 50→900 ramp (`tokens/colors.css`). Emerald is the single accent — used for CTAs, links, ticks, the active state and KPI figures. Functional accents (amber/rose/blue) exist for status only and appear rarely. Two surface worlds: **light** (Paper ground, white cards) for content/handouts, and **dark** (Ink gradient) for openers, section breaks and CTA bands.

**Type.** Display & headings in **Manrope** (ExtraBold/Bold, tight tracking −0.02 to −0.025em). UI & body in **Inter** (400/500/600). Chinese in **Noto Sans SC** (with a more generous 1.85 line-height for CJK body). Data, KPIs, codes and technical labels in **JetBrains Mono** — the mono numerals are a deliberate signal of measurement and rigor. Eyebrows are Inter 600, UPPERCASE, 0.12em tracking, almost always preceded by the **brand tick** (a 22–30px × 2px emerald bar).

**Spacing & layout.** 4px base unit. Generous, structured rhythm — sections breathe (96px vertical), content sits in clear 2-column grids (points + side panel). Containers cap ~1180–1320px. Slides are a fixed 1280×720 canvas.

**Backgrounds.** No photography in the core system. The signature motif is the **"wing" gradient** (`--grad-wing`: ink → emerald → mint) derived from the logo, used as a large, low-opacity (14–22%), slightly-rotated shape bleeding off a dark panel's corner. Dark grounds use `--grad-dark` (ink-800 → ink-900). Light sections may use a subtle `--grad-mint-fade`. No noise/grain, no busy patterns.

**Corner radii.** Soft but professional: cards `14px` (lg), panels `20–28px` (xl/2xl), controls `10px` (md), small chips `6px`. Pills (`999px`) are reserved for tags, status dots and KPI chips — not buttons.

**Borders.** Hairline `1px` in ink-100/200. Cards get a subtle border *and* a soft shadow. A recurring device is the **top-left accent rule** — a short (48–56px) emerald (or `--grad-brand`) bar pinned to a card's top edge.

**Shadows / elevation.** Always **ink-tinted, never pure black** (`rgba(31,41,51,…)`). Five soft steps xs→xl plus a `--shadow-brand` emerald glow used sparingly on the primary CTA. Inner shadows are rare.

**Motion.** Restrained and functional. Standard ease `cubic-bezier(0.2,0.7,0.2,1)`, 120–320ms. Cards lift `translateY(-3 to -4px)` + deepen shadow on hover. No bounces, no infinite loops, no parallax. Slide entrance animations (if any) animate *from* hidden and respect `prefers-reduced-motion`.

**Interaction states.**
- **Hover:** primary buttons darken via `brightness(0.94)`; cards lift; nav/text links shift from muted → body color; tags tint toward brand-soft.
- **Press:** buttons nudge down `translateY(1px)`.
- **Focus:** 3px emerald ring (`--ring-brand`).
- **Selected/active:** emerald underline (tabs), ink fill or brand-soft tint (steps, tags).

**Transparency & blur.** Used only for the sticky header (`rgba(247,250,248,0.82)` + 14px blur) and modal scrims (`rgba(20,27,33,0.46)` + light blur). Not decorative.

**Imagery color vibe.** When imagery is added later it should read **cool, calm, desaturated**, leaning emerald/ink — never warm or high-saturation. User-supplied photos drop into placeholders; we don't generate or hand-draw illustrations.

---

## Iconography

The brand has **no custom icon set** in the source material, and uses **no emoji**. Approach:

- **Functional unicode glyphs** carry most micro-icon duty: `→` (CTA / next), `↑ ↓ →` (metric trend), `✓` (done / success), `×` (close / remove), `!` (warning). These match the geometric, restrained tone and need no assets.
- **The logo mark itself** (`assets/logo-mark.png` / `assets/logo-appicon.png`) is the one bespoke graphic — a layered forward-motion "wing."
- **For richer UI icons** (when a kit needs them), use **Lucide** (https://lucide.dev) from CDN — 1.5–2px stroke, rounded caps, which matches the system's weight. **Flag:** this is a *substitution*; no icon set was provided. If the brand adopts an official set, swap it in `assets/` and update this section.
- Numbered badges (`01`, `02`…) in JetBrains Mono stand in for sequence icons in steppers and lists.

---

## Files & index

**Foundations**
- `styles.css` — the single entry point consumers link. `@import`s only.
- `tokens/fonts.css` — Google Fonts import (Inter, Manrope, Noto Sans SC, JetBrains Mono). *See caveat below.*
- `tokens/colors.css` · `typography.css` · `spacing.css` · `effects.css` — CSS custom properties (base ramps + semantic aliases).
- `tokens/base.css` — element resets + helper classes (`.by-eyebrow`, `.by-display`, `.by-container`, `.by-accent-rule`).

**Assets** (`assets/`)
- `logo-lockup.png` — horizontal lockup (mark + wordmark + subline).
- `logo-mark.png` — the wing mark, on paper.
- `logo-appicon.png` — app icon (white/emerald wing on ink square).

**Guideline specimen cards** (`guidelines/*.html`) — render in the Design System tab. Colors (brand, emerald, ink, semantic), Type (display, body, eyebrow, mono, CJK, scale), Spacing (scale, radii, elevation), Brand (logo, mark, gradients).

**Components** (`components/`, `window.BenYanAIDesignSystem_5a2b7b`)
- `core/` — `Button`, `Badge`, `Tag`, `Eyebrow`, `Avatar`
- `surfaces/` — `Card`, `CaseCard`, `Callout`
- `data/` — `Metric`, `ProgressSteps`
- `navigation/` — `Tabs`

**Slides** (`slides/*.html`, 1280×720) — `TitleSlide`, `AgendaSlide`, `SectionDivider`, `ContentSlide`, `MethodologySlide`, `CaseStudySlide`, `ClosingSlide`.

**UI kits** (`ui_kits/`)
- `web/` — interactive course-showcase site (hero, courses, case library, booking modal).

**Other**
- `SKILL.md` — Agent-Skill manifest for use in Claude Code.

---

## Caveats

- **Fonts are loaded from Google Fonts** (CDN `@import`), not self-hosted, so the compiler reports 0 `@font-face` rules. All four families (Inter, Manrope, Noto Sans SC, JetBrains Mono) are free Google fonts and exactly match the brand sheet's stated direction. If you need offline/self-hosted binaries, drop the `.woff2` files into `assets/fonts/` and replace the `@import` in `tokens/fonts.css` with local `@font-face` rules.
- **Logo assets are raster crops** from the concept sheet (no vector source was provided). They're clean at display sizes but not infinitely scalable — **please share an SVG/vector logo** if you have one.
- **Exact green:** the sheet labels the green `#0D8F7A`; sampled pixels read ~`#0C8875`. We standardized on **`#0D8B76`**. Tell me if you have an official hex.
- **Lucide** is a substitution for a richer icon set — confirm or replace.
