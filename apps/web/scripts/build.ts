import { copyFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { $ } from 'execa'

import { precheck } from './precheck'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const workdir = path.resolve(__dirname, '..')

async function main() {
  await precheck()
  await $({ cwd: workdir, stdio: 'inherit' })`vite build`
  await copyFile(path.resolve(workdir, 'dist/index.html'), path.resolve(workdir, 'dist/404.html'))
}

main()
