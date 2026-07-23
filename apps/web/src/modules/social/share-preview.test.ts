import assert from 'node:assert/strict'
// eslint-disable-next-line test/no-import-node-test -- GitHub Pages CI runs focused tests with `tsx --test`.
import test from 'node:test'

import { resolveSharePreviewUrl } from './share-preview'

const photo = {
  id: 'DSC08646',
  thumbnailUrl: '/thumbnails/DSC08646.jpg',
  originalUrl: 'https://raw.githubusercontent.com/jyxu0621/gallery-photos/main/photos/DSC08646.jpg',
}

test('uses the generated thumbnail for a static GitHub Pages preview', () => {
  assert.equal(
    resolveSharePreviewUrl(photo, 'https://jyxu0621.github.io', false),
    'https://jyxu0621.github.io/gallery/thumbnails/DSC08646.jpg',
  )
})

test('falls back to the original image when a static thumbnail is unavailable', () => {
  assert.equal(
    resolveSharePreviewUrl({ ...photo, thumbnailUrl: null }, 'https://jyxu0621.github.io', false),
    photo.originalUrl,
  )
})

test('uses the dynamic OG endpoint only when SSR or Cloud is enabled', () => {
  assert.equal(
    resolveSharePreviewUrl(photo, 'https://jyxu0621.github.io', true),
    'https://jyxu0621.github.io/gallery/og/DSC08646',
  )
})
