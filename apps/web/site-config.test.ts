import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
// eslint-disable-next-line test/no-import-node-test -- GitHub Pages CI runs focused tests with `tsx --test`.
import test from 'node:test'

test('uses the approved Chinese site description instead of a corrupted placeholder', async () => {
  const config = JSON.parse(await readFile(new URL('../../config.json', import.meta.url), 'utf8'))

  assert.equal(config.description, '摄影、飞行、风光、旅途')
  assert.doesNotMatch(config.description, /^\?+$/)
})
