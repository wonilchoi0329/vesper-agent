# Code-Only Build Workflow

Use this workflow when building screens or features without a Figma design. No Figma access.
No new tokens. No new components. Build only from what already exists.

---

## Laws (never break)

1. **Tokens only.** Every value → existing semantic CSS var from `shared/tokens/tokens.css`. If a
   value has no token, stop and ask — never invent a token, never hardcode.
2. **Registry first.** Every UI element → existing component from `shared/component-registry.md`.
   If a component doesn't exist, try to satisfy the need with existing components before
   requesting a new one. Only escalate when no combination of existing components can work.
3. **No assumptions.** If the request is ambiguous, ask before building. Do not infer layout,
   spacing, or visual treatment beyond what tokens and components already define.
4. **Audit gate.** Present a plan and wait for confirmation before writing any code.

---

## Phase 1 — Read Tokens

Read `shared/tokens/tokens.css`. This is the complete list of available values.
Read `shared/type-library/textStyles.ts`. This is the complete list of available text styles.

Note what exists. Do not reference anything outside these files.

---

## Phase 2 — Read Component Registry

Read `shared/component-registry.md` in full.

For each UI element needed:

**Found in registry** → use it as specified.

**Not found** → before flagging as a blocker, attempt to satisfy the need using existing
components. Work through these in order:

1. **Compose** — can existing components be combined to achieve the same result?
   e.g. need a labelled input group → `Label` + `InputField` composed together
2. **Adapt** — does a registry component cover this via an existing prop/variant?
   e.g. need a destructive button → `Button` with `variant="danger"` if that variant exists
3. **Simplify** — can the feature be delivered with reduced scope using what exists?
   e.g. need a rich select → use a native `<select>` styled with tokens if functionally acceptable

If none of these work and the element is functionally essential (e.g. a text input with no
`InputField` in registry), flag it as a **new component request** in the plan — not a blocker.
The build waits for explicit user permission before proceeding.

---

## Phase 3 — Plan + Confirmation

Before writing any code, output a build plan:

```
Build Plan: [Screen/Feature Name]
──────────────────────────────────
Components ([N]):
  ✓ Button       (variant: primary)
  ✓ Card
  ✓ InputField   (variant: text)
  ~ SearchBar    — not in registry, composed from InputField + Button (no new component needed)

Layout: [brief description of structure]

Tokens used:
  spacing: var(--space-layout-lg), var(--space-component-md)
  colors:  var(--color-surface-default), var(--color-text-primary)
  type:    textStyles.body.md, textStyles.heading.lg

New components requested ([N] — explicit permission required):
  ? TextField — no registry component can substitute a text input. Propose building
    using existing tokens only (no Figma source). Approve to include in this build.

[or: No new components needed]

Confirm to build?
```

**For new component requests:** do not proceed until the user explicitly approves that
specific component. If approved, build it inline in the screen file as a one-off — no
separate file, not added to the registry yet. Tokens only, no hardcoded values.

If the user says no, remove that element from scope and build the rest.

---

## Phase 4 — Build

Read `shared/project.config.json` for styling approach.

Compose the screen from registry imports and layout-only flex divs.

**Approved one-off components** — inline in the screen file, not extracted:
- Defined as a plain function above the screen component in the same file
- Tokens only — no hardcoded values, no new tokens
- Comment marking it as a one-off candidate:
  ```tsx
  // ONE-OFF: TextField — not in registry yet. Approve to extract after review.
  function TextField({ ... }) { ... }
  ```

**Layout rules:**
- Structure comes from the request description — use judgment for composition
- All spacing via `var(--space-*)` tokens only
- All colors via `var(--color-*)` tokens only
- All typography via `textStyles.*` only
- Flex/grid for layout structure — no hardcoded widths unless a token exists for it

**Styling by approach (from project.config.json):**

| Approach | Usage |
|---|---|
| styled-components | `` styled.div`padding: var(--space-lg)` `` |
| emotion | same as styled-components |
| css-modules | `.wrapper { padding: var(--space-lg); }` |
| inline | `style={{ padding: 'var(--space-lg)' }}` |

Typography: always `style={textStyles.*}` — never individual `--type-*` vars.

Files: screens → `src/app/[route]/page.tsx` or `src/pages/[route].tsx`

---

## Phase 5 — QA

- [ ] No hardcoded colors, spacing, radii, or font values
- [ ] No components built outside the registry without explicit user approval
- [ ] Approved one-off components are inline in the screen file, not extracted
- [ ] One-off components marked with // ONE-OFF comment
- [ ] Post-build registry prompt shown after user reviews
- [ ] No new tokens invented
- [ ] All text layers use `textStyles.*`
- [ ] No `--type-*` vars used directly
- [ ] Every component imported from `@/components/ui`
- [ ] Nothing built without plan confirmation

```
Build Complete: [Screen]
Components used: [list from registry]
One-off components (inline, not registered): [list if any]
Tokens used: [list]
Files: [list]
```

**After the user reviews the result**, ask for each one-off component:
```
TextField was built as a one-off inline component. Would you like to:
  A) Extract it to src/components/ui/TextField.tsx and add to the registry
  B) Leave it as-is in this file for now
```

If A: extract to its own file, add to `shared/component-registry.md` with
`Figma name: none — built from tokens only`, populate `Does NOT cover` from
what was actually built. Update the screen import accordingly.

---

## Failure modes

| Symptom | Fix |
|---|---|
| Component not in registry | Try composition/adaptation first, then request permission |
| One-off component in separate file | Must stay inline until user approves extraction |
| One-off component hardcodes values | Only existing tokens allowed — no exceptions |
| No token for a spacing/color value | Stop — ask user, never hardcode |
| Layout looks wrong | Adjust composition using existing tokens only |
| Feature needs a new text style | Stop — add to typography.json and re-sync bootstrap |
