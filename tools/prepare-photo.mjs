import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import sharp from 'sharp'

const [source, destination] = process.argv.slice(2)
if (!source || !destination) {
  console.error('Usage: node tools/prepare-photo.mjs <source> <destination>')
  process.exit(2)
}

const output = await sharp(await readFile(source))
  .rotate()
  .resize({ width: 3000, height: 3000, fit: 'inside', withoutEnlargement: true })
  .toColorspace('srgb')
  .jpeg({ quality: 85, mozjpeg: true })
  .toBuffer()

await mkdir(path.dirname(destination), { recursive: true })
await writeFile(destination, output)

const metadata = await sharp(output).metadata()
if (metadata.format !== 'jpeg' || Math.max(metadata.width ?? 0, metadata.height ?? 0) > 3000) {
  throw new Error('Prepared photo failed format or dimension validation')
}
console.info(`${path.basename(destination)}: ${metadata.width}x${metadata.height}, JPEG 85`)
