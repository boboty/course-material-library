# Web UI Kit — Course Showcase Site

An interactive marketing/showcase site for BenYan AI's enterprise AI courses. Demonstrates the design system's components composed into a real product surface.

## Run
Open `index.html`. Requires the compiled `_ds_bundle.js` at the project root (generated automatically).

## Files
- `index.html` — page shell, loads React + Babel + the DS bundle, then the part scripts.
- `Parts1.jsx` — `Header` (sticky nav) and `Hero` (dark band with stats).
- `Parts2.jsx` — `Courses` grid, `Cases` library with tab filter, `Footer` CTA band.
- `App.jsx` — page composition + `BookingModal` (the one stateful flow).

## Components used
`Button`, `Eyebrow`, `Badge`, `Tag`, `CaseCard`, `Metric`, `Tabs`, `Avatar` — all from `window.BenYanAIDesignSystem_5a2b7b`.

## Interactions
- Header nav highlights the active section.
- Case library tabs filter the `CaseCard` grid by industry.
- "预约内训" opens a booking modal with a success state.

This is a cosmetic recreation, not production code — data is local and forms are faked.
