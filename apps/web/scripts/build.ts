import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { $ } from 'execa'

import { precheck } from './precheck'
import { emitPagesFallback } from './pages-fallback'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const workdir = path.resolve(__dirname, '..')

async function main() {
  await precheck()
  await $({ cwd: workdir, stdio: 'inherit' })`vite build`
  await emitPagesFallback(path.resolve(workdir, 'dist'))
}

main()
