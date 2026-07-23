import { readFile } from 'node:fs/promises'

const manifestPath = new URL('../apps/web/src/data/photos-manifest.json', import.meta.url)
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
const forbiddenKeys = /^(gps|location|latitude|longitude|serial(number)?|bodyserialnumber)$/i
const violations = []

function visit(value, path = '$') {
  if (Array.isArray(value)) {
    value.forEach((item, index) => visit(item, `${path}[${index}]`))
    return
  }
  if (!value || typeof value !== 'object') return

  for (const [key, child] of Object.entries(value)) {
    const nextPath = `${path}.${key}`
    if (forbiddenKeys.test(key) && child !== null && child !== '' && child !== undefined) {
      violations.push(nextPath)
    }
    visit(child, nextPath)
  }
}

visit(manifest)
if (violations.length) {
  console.error(`Privacy audit failed: ${violations.join(', ')}`)
  process.exit(1)
}
console.info('Privacy audit passed: no GPS, location, or serial metadata found.')
