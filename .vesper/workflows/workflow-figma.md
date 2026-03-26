# Figma Build Workflow

> All Figma access is via `get_design_context` only — never call native Figma tools directly.

---

## Laws (never break)

1. **Tokens first.** Every color, spacing, radius, shadow, and font → semantic CSS var. Nothing hardcoded. Ever.
2. **Registry first.** Read `shared/component-registry.md` before any code. Existing component → import, never rebuild.
3. **Figma is the spec.** Build only what Figma defines. No assumed variants, no invented states.
4. **Audit gate.** Never write code before the Pre-Build Audit is confirmed by the user.

---

## Phase 1 — Read Tokens

Read `shared/tokens/tokens.css`. Know what vars exist before touching Figma.

```
✓  var(--color-action-primary)    colors, spacing, radius, shadow
✓  textStyles.body.md             typography — always textStyles.*, never --type-* vars
✗  var(--color-blue-500)          primitive — never in components
✗  #3B82F6 / 16px                 hardcoded — never
```

Missing token → collect for Pre-Build Audit. Never hardcode. Never proceed with approximated values.

---

## Phase 2 — Read Component Registry

Read `shared/component-registry.md` in full. This is mandatory — law 2.

- Exact `Figma name:` match → import, done
- Partial match → flag `⚠ possible match` in audit
- No match → build from Figma spec in Phase 4

Registry entry format:
```
## ComponentName
- Import: `import { ComponentName } from '@/components/ui'`
- Figma name: "Buttons/Primary"
- Built from: [node URL]
- Props: `variant?: 'primary'|'secondary'`
- File: src/components/ui/ComponentName.tsx
- Covers: [patterns]
- Does NOT cover: [what Figma does not define]
```

---

## Phase 3 — Extract Figma Context + Navigation Map + Pre-Build Audit

Call `get_design_context` on the screen link. For each unregistered component instance, call
`get_design_context` on that node specifically.

Extract: layer tree, Auto Layout (direction/gap/padding/sizing/clip), component instances vs
layout frames, all values mapped to tokens, Text Style names.

### Navigation — always do this before building multi-screen flows

When building screens, derive the navigation map from:

1. **Artboard/frame names** — names like `Page1/NoInput`, `Page1/hasInput`, `Page2/Tab1` reveal
   screen identity and states. Parse `/` as `Screen/State`.
2. **Prototype connections** — `get_design_context` on interactive nodes (buttons, rows, back arrows)
   may return `onClick` destinations. Collect all of them.
3. **Name heuristics** — if prototype data is absent, infer from names:
   - `back-arrow` or `BackArrow` → go to previous screen in history
   - CTA button on `Page N` → navigates to `Page N+1` (unless name says otherwise)
   - Row labeled "Pull up sheet" / "Open …" → opens in-screen modal/sheet, not a new screen
   - "Done" / "Complete" / "Finish" frames → terminal screen, back only

**Output navigation map before writing any screen code:**

```
Navigation Map: [Section/Flow Name]
────────────────────────────────────
Screens:  page1 (Page1/NoInput, Page1/hasInput)
          page2 (Page2/Tab1, Page2/Tab2)
          page3 (Page3, Page3/sheetOpen)
          page4 (Page4)

Connections:
  page1  CTA button  →  page2
  page2  back-arrow  →  page1
  page2  CTA button  →  page3
  page3  back-arrow  →  page2
  page3  row "Pull up sheet"  →  sheet modal (in-screen, not a new screen)
  page3  CTA button  →  page4
  page4  back-arrow  →  page3

Router: history-stack (push on navigate, pop on back)
Source: [prototype / name-inferred / mixed]
```

Flag any connection whose source is `name-inferred` — confirm with user before building if
navigation is ambiguous (e.g. multiple CTAs, non-sequential screen names).

**Output audit — no code before this is confirmed (law 4):**

```
Pre-Build Audit: [Screen Name]
──────────────────────────────
Reusing ([N]):  ✓ Button ← "Buttons/Primary"   ⚠ Badge ← possible match "Pill"?
Building ([N]): → UserCard "Cards/User Card" (variants: default, compact)
Layout only:    → page wrapper, sidebar

Tokens missing ([N] — must resolve):
  ✗ #FF5733 → suggest color.feedback.warning in tokens.json

Text styles unmatched ([N] — must resolve):
  ✗ "Display/Hero" — fontSize 64px unmatched → add type.* entry to typography.json, re-run bootstrap

[or: Tokens ✓  Text styles ✓]

Confirm to build?
```

For unmatched text styles: the user needs to add the missing `type.*` entry to `typography.json`,
re-run `node scripts/generate-tokens.js`, and re-run bootstrap text style sync before building.

---

## Phase 4 — Build

Read `shared/project.config.json` for styling approach.

**Per new component:**
1. `get_design_context` on its node
2. Build only Figma-defined variants and states
3. All values from CSS vars. Typography via `textStyles.*`
4. Save → register in `shared/component-registry.md` → add to `src/components/ui/index.ts`

**Styling by approach:**

| Approach | Typography usage |
|---|---|
| styled-components | `` const El = styled.span`${textStyles.body.md}` `` |
| emotion | `const El = styled.span(textStyles.body.md)` |
| css-modules | Write individual `--type-*` vars in `.module.css` (only case allowed) |
| inline | `<span style={textStyles.body.md}>` |

**Auto Layout → CSS:**

| Figma | CSS |
|---|---|
| Horizontal AL | `display:flex; flex-direction:row` |
| Vertical AL | `display:flex; flex-direction:column` |
| Gap | `gap: var(--space-X)` |
| Padding | `padding: var(--space-T) var(--space-R) var(--space-B) var(--space-L)` |
| Fill container | `flex:1` |
| Hug contents | `width:fit-content` |
| Clip content ON | `overflow:hidden` |
| Absolute | `position:absolute` + offsets |

Files: components → `src/components/ui/`, screens → `src/app/[route]/page.tsx`

---

## Phase 5 — QA

- [ ] No hardcoded colors, spacing, font values
- [ ] No `--type-*` vars in components — `textStyles.*` only
- [ ] Auto Layout frame count = flex div count
- [ ] Every new component registered with Figma name + Does NOT cover
- [ ] Every new component in `index.ts` barrel
- [ ] Clip content → `overflow:hidden` matches
- [ ] Nothing built without audit confirmation

```
Build Complete: [Screen]
Reused: [N] | Built: [N] | Mismatches: [none or list]
Files: [list]
```

---

## Failure modes

| Symptom | Fix |
|---|---|
| Text wraps | Fixed-width in Figma → add `width`/`max-width` |
| Spacing off | Gap = between children, padding = inside frame |
| Element overflows | Check Figma "Clip content" → `overflow:hidden` |
| Component rebuilt | Read registry before any code |
| Extra variants | Figma only — check "Does NOT cover" |
| Token hardcoded | Surface in audit, never bypass |
| Wrong text style | Check `text-style-map.json` has the Figma name |
| Duplicate component | Populate `Figma name:` on every entry |
| Navigation guessed post-build | Run Phase 3 navigation map step before any screen code |
| Sheet treated as new screen | "Pull up …" / "Open …" row names → in-screen modal, not a route |
