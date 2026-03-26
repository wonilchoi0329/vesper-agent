// generate-tokens.js
// DTCG format — Style Dictionary source files
// Single token system for the entire monorepo
//
// Usage:
//   node .vesper/scripts/generate-tokens.js
//
// Reads from project root:
//   primitives.json          — raw values (colors, base spacing, etc.)
//   tokens.json              — semantic aliases referencing primitives e.g. {color.blue.500}
//   typography.json          — composite type styles referencing primitives
//   shared/text-style-map.json — maps Figma Text Style names → typography token paths
//
// Writes to project root:
//   shared/tokens/tokens.css          — resolved CSS custom properties
//   shared/tokens/tokens.ts           — resolved typed TS token constants
//   shared/type-library/textStyles.ts — named text style objects for use in components

const fs   = require('fs')
const path = require('path')

// ─── Resolve project root ─────────────────────────────────────────────────────
// Script lives in .vesper/scripts/, so go up two levels to reach project root

const root = path.resolve(__dirname, '../..')
if (!fs.existsSync(path.join(root, 'primitives.json')) &&
    !fs.existsSync(path.join(root, 'tokens.json'))) {
  console.error('❌ Token files not found at project root')
  console.error(`   Looked for primitives.json and tokens.json in: ${root}`)
  console.error(`   Run: node .vesper/scripts/generate-tokens.js`)
  process.exit(1)
}

// ─── Load source files ────────────────────────────────────────────────────────

function loadJson(filename, required = true) {
  const p = path.join(root, filename)
  if (!fs.existsSync(p)) {
    if (required) {
      console.error(`❌ ${filename} not found at monorepo root (${root})`)
      process.exit(1)
    }
    return null
  }
  return JSON.parse(fs.readFileSync(p, 'utf8'))
}

const primitives   = loadJson('primitives.json')
const tokens       = loadJson('tokens.json')
const typography   = loadJson('typography.json')
const textStyleMap = loadJson('shared/text-style-map.json', false) // optional until populated

// ─── DTCG: build unified lookup map ──────────────────────────────────────────
// Key: dot-path (e.g. "type.body.md"), Value: raw $value (string or object)

function buildLookup(obj, prefix = '', map = {}) {
  for (const [key, val] of Object.entries(obj)) {
    if (key.startsWith('$')) continue
    if (key === 'prefix') continue  // skip custom metadata field
    const dotPath = prefix ? `${prefix}.${key}` : key
    if (val && typeof val === 'object' && '$value' in val) {
      map[dotPath] = val.$value  // preserve object values for composite tokens
    } else if (val && typeof val === 'object') {
      buildLookup(val, dotPath, map)
    }
  }
  return map
}

const lookup = {
  ...buildLookup(primitives),
  ...buildLookup(tokens),
  ...buildLookup(typography),
}

// ─── Resolve aliases ──────────────────────────────────────────────────────────

function resolveAlias(value, depth = 0) {
  if (depth > 10) { console.warn(`⚠ Circular alias: ${value}`); return String(value) }
  // Non-strings (numbers, booleans) are raw primitive values — return as string directly
  if (typeof value !== 'string') return String(value)
  const match = value.match(/^\{(.+)\}$/)
  if (!match) return value
  const ref = match[1]
  const resolved = lookup[ref]
  if (resolved === undefined) { console.warn(`⚠ Unresolved alias: {${ref}}`); return value }
  return resolveAlias(resolved, depth + 1)
}

function resolveValue(val) {
  // Always coerce to string — primitives may be numbers (e.g. 8, 1.5, 400)
  // resolveAlias handles alias strings; non-strings pass through as their string form
  if (typeof val !== 'string') return String(val)
  return String(resolveAlias(val))
}

function toCssVar(dotPath) {
  return '--' + dotPath.replace(/\./g, '-')
}

// ─── Collect CSS vars ─────────────────────────────────────────────────────────

const cssEntries = []

function collectCssVars(obj, prefix = '', sourceName = '') {
  for (const [key, val] of Object.entries(obj)) {
    if (key.startsWith('$')) continue
    if (key === 'prefix') continue  // skip custom metadata field
    const dotPath = prefix ? `${prefix}.${key}` : key
    const varName = toCssVar(dotPath)
    if (val && typeof val === 'object' && '$value' in val) {
      const raw = val.$value
      if (typeof raw === 'object' && raw !== null) {
        for (const [prop, propVal] of Object.entries(raw)) {
          cssEntries.push({ varName: `${varName}-${prop}`, value: resolveValue(String(propVal)), source: sourceName })
        }
      } else {
        cssEntries.push({ varName, value: resolveValue(String(raw)), source: sourceName })
      }
    } else if (val && typeof val === 'object') {
      collectCssVars(val, dotPath, sourceName)
    }
  }
}

collectCssVars(primitives, '', 'primitives')
collectCssVars(tokens,     '', 'tokens')
collectCssVars(typography, '', 'typography')

// ─── Build TS token object ────────────────────────────────────────────────────

function buildTsObject(obj) {
  const result = {}
  for (const [key, val] of Object.entries(obj)) {
    if (key.startsWith('$')) continue
    if (key === 'prefix') continue  // skip custom metadata field
    if (val && typeof val === 'object' && '$value' in val) {
      const raw = val.$value
      if (typeof raw === 'object' && raw !== null) {
        result[key] = {}
        for (const [prop, propVal] of Object.entries(raw)) {
          result[key][prop] = resolveValue(String(propVal))
        }
      } else {
        result[key] = resolveValue(String(raw))
      }
    } else if (val && typeof val === 'object') {
      result[key] = buildTsObject(val)
    }
  }
  return result
}

// ─── Build textStyles object from text-style-map.json ────────────────────────
//
// text-style-map.json maps Figma Text Style names to typography token paths:
// {
//   "Heading/Display XL": "type.heading.xl",
//   "Body/MD Regular":    "type.body.md",
//   "Label/SM Medium":    "type.label.sm"
// }
//
// For each entry, we look up the token path in the DTCG lookup, resolve all
// composite $value properties to CSS vars, and build a named style object:
//
// textStyles.heading.displayXl = {
//   fontSize:   'var(--type-heading-xl-fontSize)',
//   fontWeight: 'var(--type-heading-xl-fontWeight)',
//   lineHeight: 'var(--type-heading-xl-lineHeight)',
//   fontFamily: 'var(--type-heading-xl-fontFamily)',
// }

function figmaNameToKey(figmaName) {
  // "Heading/Display XL" → "heading.displayXl"
  // "Body/MD Regular"    → "body.mdRegular"
  return figmaName
    .split('/')
    .map((segment, i) => {
      const words = segment.trim().split(/\s+/)
      return words.map((w, j) => {
        const lower = w.toLowerCase()
        // camelCase within segment after first word, PascalCase for subsequent segments
        return (i === 0 && j === 0) ? lower : lower.charAt(0).toUpperCase() + lower.slice(1)
      }).join('')
    })
    .join('.')
}

function buildTextStyles(map) {
  if (!map) return null

  const styles = {}
  const missing = []

  for (const [figmaName, tokenPath] of Object.entries(map)) {
    const token = lookup[tokenPath]

    if (!token) {
      missing.push({ figmaName, tokenPath })
      continue
    }

    // token.$value should be a composite object for typography tokens
    const rawValue = typeof token === 'object' && '$value' in token ? token.$value : token

    if (typeof rawValue !== 'object' || rawValue === null) {
      console.warn(`⚠ Token at "${tokenPath}" is not a composite typography token`)
      continue
    }

    // Build style object with CSS var references
    const styleObj = {}
    for (const [prop, propVal] of Object.entries(rawValue)) {
      styleObj[prop] = `var(${toCssVar(tokenPath)}-${prop})`
    }

    // Set into nested object using dot-path key
    const key = figmaNameToKey(figmaName)
    const parts = key.split('.')
    let cursor = styles
    for (let i = 0; i < parts.length - 1; i++) {
      if (!cursor[parts[i]]) cursor[parts[i]] = {}
      cursor = cursor[parts[i]]
    }
    cursor[parts[parts.length - 1]] = styleObj
  }

  if (missing.length > 0) {
    console.warn(`\n⚠ Text style map has ${missing.length} unresolved token path(s):`)
    missing.forEach(({ figmaName, tokenPath }) => {
      console.warn(`   "${figmaName}" → "${tokenPath}" (not found in typography.json)`)
    })
  }

  return styles
}

// ─── Emit CSS ─────────────────────────────────────────────────────────────────

const groupedCss = [
  '/* ── Primitives ── */',
  ...cssEntries.filter(e => e.source === 'primitives').map(e => `  ${e.varName}: ${e.value};`),
  '',
  '/* ── Semantic Tokens ── */',
  ...cssEntries.filter(e => e.source === 'tokens').map(e => `  ${e.varName}: ${e.value};`),
  '',
  '/* ── Typography ── */',
  ...cssEntries.filter(e => e.source === 'typography').map(e => `  ${e.varName}: ${e.value};`),
].join('\n')

const css = `/* Auto-generated — do not edit manually
   Sources: primitives.json, tokens.json, typography.json
   Regenerate: node scripts/generate-tokens.js */

:root {
${groupedCss}
}
`

// ─── Emit tokens.ts ───────────────────────────────────────────────────────────

const tsTokens = {
  primitives: buildTsObject(primitives),
  tokens:     buildTsObject(tokens),
  typography: buildTsObject(typography),
}

const tsTokensFile = `// Auto-generated — do not edit manually
// Sources: primitives.json, tokens.json, typography.json
// Regenerate: node scripts/generate-tokens.js

export const primitives = ${JSON.stringify(tsTokens.primitives, null, 2)} as const
export const tokens     = ${JSON.stringify(tsTokens.tokens,     null, 2)} as const
export const typography = ${JSON.stringify(tsTokens.typography, null, 2)} as const

export const allTokens = { primitives, tokens, typography } as const
export type AllTokens = typeof allTokens
`

// ─── Emit textStyles.ts ───────────────────────────────────────────────────────

const textStyles = buildTextStyles(textStyleMap)

const tsTextStylesFile = textStyles ? `// Auto-generated — do not edit manually
// Source: shared/text-style-map.json + typography.json
// Regenerate: node scripts/generate-tokens.js
//
// Usage:
//   import { textStyles } from '@type-library'
//   <p style={textStyles.body.md}>...</p>
//   <h1 style={textStyles.heading.displayXl}>...</h1>

import type { CSSProperties } from 'react'

export const textStyles = ${JSON.stringify(textStyles, null, 2)} as const satisfies Record<string, Record<string, CSSProperties>>

export type TextStyleKey = keyof typeof textStyles
` : null

// ─── Write files ──────────────────────────────────────────────────────────────

const tokensDir    = path.join(root, 'shared', 'tokens')
const typeLibDir   = path.join(root, 'shared', 'type-library')

fs.mkdirSync(tokensDir,  { recursive: true })
fs.writeFileSync(path.join(tokensDir, 'tokens.css'), css)
fs.writeFileSync(path.join(tokensDir, 'tokens.ts'),  tsTokensFile)

const primCount  = cssEntries.filter(e => e.source === 'primitives').length
const tokCount   = cssEntries.filter(e => e.source === 'tokens').length
const typCount   = cssEntries.filter(e => e.source === 'typography').length
const unresolved = cssEntries.filter(e => typeof e.value === 'string' && e.value.startsWith('{')).length

console.log(`✓ shared/tokens/tokens.css  (${primCount} primitive + ${tokCount} semantic + ${typCount} typography = ${primCount + tokCount + typCount} vars)`)
console.log(`✓ shared/tokens/tokens.ts`)

if (unresolved > 0) {
  console.warn(`  ⚠ ${unresolved} unresolved aliases — check warnings above`)
}

if (tsTextStylesFile) {
  fs.mkdirSync(typeLibDir, { recursive: true })
  fs.writeFileSync(path.join(typeLibDir, 'textStyles.ts'), tsTextStylesFile)
  const styleCount = Object.values(textStyleMap).length
  console.log(`✓ shared/type-library/textStyles.ts  (${styleCount} text styles)`)
} else {
  console.log(`ℹ shared/text-style-map.json not found — skipping textStyles.ts`)
  console.log(`  Create shared/text-style-map.json to generate the type library`)
}
