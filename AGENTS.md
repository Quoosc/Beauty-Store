<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:beautystore-design-rules -->
# Design Reference — MANDATORY

All UI work in this project MUST reference and comply 100% with the designs in:
`d:\HK6 UIT\Kiến trúc phần mềm\src\`

This folder contains the authoritative Figma exports and architecture/UI descriptions for BeautyStore.
Before implementing any page or component:
1. Find the corresponding screen in `src/app/pages/` or `src/app/components/`
2. Match: colors, layout, spacing, typography, interactions
3. Use the design token mappings in `../docs/design-reference.md`

Do NOT invent UI that deviates from `src/` designs without explicit user instruction.

# Project Documentation

Full context, guidelines and conventions are in `../docs/`:
- `system-overview.md`   — Architecture, tech stack, screens, API endpoints
- `coding-convention.md` — TypeScript, component, store, service conventions
- `user-stories.md`      — 14 user stories with acceptance criteria
- `design-reference.md`  — Design tokens, component patterns, compliance checklist
<!-- END:beautystore-design-rules -->
