# Figma Bootstrap

Run this once when `shared/project.config.json` does not exist. Never read this file again
after bootstrap is complete.

---

## Step 1 — Detect project config

Read `package.json` and `tsconfig.json`. Infer framework and TypeScript. For styling, if
multiple libraries are present (e.g. both `styled-components` and `@emotion/styled`), ask
the user to pick: `styled-components` / `emotion` / `css-modules` / `inline`

Write `shared/project.config.json`:
```json
{ "framework": "next", "typescript": true, "styling": "styled-components" }
```

---

## Step 2 — Confirm token files at monorepo root

- `primitives.json` — raw values, never referenced directly in components
- `tokens.json` — semantic aliases via `{dot.path}` syntax
- `typography.json` — two sections:
  - `font.*` — individual primitives (family, weight, size, line-height)
  - `type.*` — composite styles referencing font primitives, one per Figma Text Style:
    ```json
    "type": {
      "body": {
        "md": {
          "$value": {
            "fontFamily": "{font.family.Messina}",
            "fontSize":   "{font.size.md}",
            "fontWeight": "{font.weight.Regular}",
            "lineHeight": "{font.line-height.md}"
          },
          "$type": "typography"
        }
      }
    }
    ```
  If `type.*` entries are missing, stop — `textStyles.ts` cannot be generated without them.

---

## Step 3 — Sync text styles from Figma

Call `get_design_context` on the user's Figma file to extract all Text Styles with their full
property values (`fontFamily`, `fontSize`, `fontWeight`, `lineHeight`, etc.).

Read `typography.json` and resolve all `type.*` composite tokens to concrete values.

For each Figma Text Style, find the `type.*` token where every property matches exactly:
- `fontSize` number (e.g. `14`) → normalise to `"14px"`
- `fontWeight` number (e.g. `400`) → normalise to `"400"`
- `lineHeight {unit, value}` → normalise to ratio (e.g. `"1.5"`)
- Properties absent from the token are ignored

Show a sync report and ask for confirmation before writing:
```
Text Style Sync
───────────────────────────────────
Matched (5):
  ✓ "Body/MD Regular"  → type.body.md
  ✓ "Body/SM Regular"  → type.body.sm
  ✓ "Label/MD"         → type.label.md
  ✓ "Heading/LG"       → type.heading.lg
  ✓ "Heading/XL"       → type.heading.xl

Unmatched — not written (1):
  ✗ "Display/Hero" — fontSize 64px, fontWeight 800 — no matching type.* token
    → Add a composite entry to typography.json and re-run bootstrap

Write shared/text-style-map.json with 5 matched styles?
```

On confirmation: write `shared/text-style-map.json`.

Only fully matched styles are written. Unmatched are excluded — add the missing `type.*` entry
to `typography.json` and re-run this step.

**Re-running this step later:**
- New Text Style added in Figma → always merges, never overwrites existing entries
- Text Style renamed → re-run, then find-replace old `textStyles.*` key in codebase
- Style values changed → update `typography.json` first, then re-run

---

## Step 4 — Run generator

```bash
node .vesper/scripts/generate-tokens.js
```

Produces:
- `shared/tokens/tokens.css` and `tokens.ts`
- `shared/type-library/textStyles.ts`

---

## Step 5 — Import tokens in each app

```css
/* globals.css */
@import '../../shared/tokens/tokens.css';
```

```json
// tsconfig.json paths
{
  "@tokens":       ["./shared/tokens/tokens.ts"],
  "@type-library": ["./shared/type-library/textStyles.ts"]
}
```

If Tailwind: extend `tailwind.config.ts` with only vars that exist in `tokens.css`. Never map primitive vars.

---

## Step 6 — Create shared files

- `shared/component-registry.md` — header only, empty
- `src/components/ui/index.ts` — empty barrel

---

## Step 7 — Done

```
Bootstrap complete. shared/project.config.json written.
Ready to build. Ask me to build a screen from Figma to get started.
```

Do not pre-generate components. The library grows from Figma screens only.
