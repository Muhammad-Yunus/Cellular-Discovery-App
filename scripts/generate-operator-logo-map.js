#!/usr/bin/env node
/**
 * generate-operator-logo-map.js
 *
 * Scans the public/operator_logos directory for PNG files and generates
 * a TypeScript file mapping operator names (canonical) to their logo URLs.
 *
 * The generated file is written to app/utils/operatorLogoMap.generated.ts.
 * Any existing alias map in operatorLogoMap.ts is preserved.
 *
 * Usage:
 *   node scripts/generate-operator-logo-map.js
 *
 * After running, review the generated file and add any additional aliases
 * or manual mappings in app/utils/operatorLogoMap.ts if needed.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Resolve script location
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Paths (relative to project root)
const projectRoot = path.resolve(__dirname, '..')
const logosDir = path.join(projectRoot, 'public', 'operator_logos')
const outputFile = path.join(projectRoot, 'app', 'utils', 'operatorLogoMap.generated.ts')

if (!fs.existsSync(logosDir)) {
  console.error(`Error: Logo directory not found at ${logosDir}`)
  process.exit(1)
}

/**
 * Extract a readable operator name from a logo filename.
 * Expected pattern: logo_<operator>.png
 * Returns the operator part with the first letter capitalized.
 */
function deriveOperatorName(filename) {
  // Remove .png extension
  const withoutExt = filename.replace(/\.png$/i, '')
  // Expect "logo_" prefix
  const prefix = 'logo_'
  if (!withoutExt.toLowerCase().startsWith(prefix)) {
    // Unexpected filename; use whole name
    return withoutExt.charAt(0).toUpperCase() + withoutExt.slice(1)
  }
  const namePart = withoutExt.slice(prefix.length)
  // Capitalize first character, keep rest as‑is
  return namePart.charAt(0).toUpperCase() + namePart.slice(1)
}

/**
 * Convert a key like "logo_telkomsel.png" to "/operator_logos/logo_telkomsel.png"
 */
function logoUrl(filename) {
  // Use forward slashes regardless of OS
  return `/operator_logos/${filename.replace(/\\/g, '/')}`
}

const files = fs.readdirSync(logosDir).filter(f => f.toLowerCase().endsWith('.png'))

if (files.length === 0) {
  console.error('No PNG files found in the logos directory.')
  process.exit(1)
}

// Build mapping entries
const entries = files.map(file => {
  const operatorName = deriveOperatorName(file)
  return { operatorName, file, url: logoUrl(file) }
})

// Sort alphabetically by operator name for readability
entries.sort((a, b) => a.operatorName.localeCompare(b.operatorName))

// Generate TypeScript code
const lines = [
  '// This file is auto-generated. Do not edit directly unless using the generation script.',
  '// It maps operator names (canonical) to their logo URLs.',
  'export const operatorLogoMap = {',
  ...entries.map(e => `  ${e.operatorName}: '${e.url}',`),
  '} as const;',
  '',
  'type OperatorKey = keyof typeof operatorLogoMap;'
]

const content = lines.join('\n') + '\n'

fs.writeFileSync(outputFile, content, 'utf8')
console.log(`Generated ${outputFile} with ${entries.length} operator entries.`)
