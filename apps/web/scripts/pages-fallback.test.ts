import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
// eslint-disable-next-line test/no-import-node-test -- GitHub Pages CI runs focused tests with `tsx --test`.
import test from 'node:test'

import { emitPagesFallback } from './pages-fallback'

test('copies the final index document to the GitHub Pages 404 fallback', async () => {
  const distDir = await mkdtemp(path.join(tmpdir(), 'afilmory-pages-'))

  try {
    const html = '<!doctype html><base href="/gallery/">'
    await writeFile(path.join(distDir, 'index.html'), html)

    await emitPagesFallback(distDir)

    assert.equal(await readFile(path.join(distDir, '404.html'), 'utf8'), html)
  }
  finally {
    await rm(distDir, { recursive: true, force: true })
  }
})
