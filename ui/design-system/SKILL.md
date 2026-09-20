---
name: benyan-ai-design
description: Use this skill to generate well-branded interfaces and assets for BenYan AI (研习 · BenYan AI), an AI-courses & enterprise-training brand — for production or throwaway prototypes, decks, case cards, web pages and workshop materials. Contains essential design guidelines, colors, type, fonts, logo assets, and reusable UI kit components for prototyping. Bilingual (中文 + English).
user-invocable: true
---

Read the `readme.md` file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, case cards, throwaway prototypes, etc), copy assets out of `assets/` and create static HTML files for the user to view — link `styles.css` for the design tokens. If working on production code, copy assets and read the rules here to become an expert in designing with this brand.

Key starting points:
- `styles.css` — the single CSS entry point (tokens + base helpers).
- `readme.md` — full voice, color, type and visual-foundation guidance.
- `guidelines/*.html` — foundation specimen cards.
- `components/` — React primitives (Button, Badge, Tag, Eyebrow, Avatar, Card, CaseCard, Callout, Metric, ProgressSteps, Tabs), exported under `window.BenYanAIDesignSystem_5a2b7b` via the compiled `_ds_bundle.js`.
- `slides/*.html` — 1280×720 slide templates (title, agenda, section, content, methodology, case study, closing).
- `ui_kits/web/` — an interactive course-showcase site.

House rules to honor: Ink/Emerald/Mint/Paper palette with emerald as the single accent; Manrope display + Inter UI + Noto Sans SC for Chinese + JetBrains Mono for data; the brand "tick" before eyebrows; the "wing" gradient as the signature dark-panel motif; ink-tinted (never black) shadows; soft radii; no emoji; restrained motion.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask a few clarifying questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.
