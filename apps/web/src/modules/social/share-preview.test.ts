import assert from 'node:assert/strict'
// eslint-disable-next-line test/no-import-node-test -- GitHub Pages CI runs focused tests with `tsx --test`.
import test from 'node:test'

import { resolveDownloadedImageFilename, resolveSharePreviewUrl } from './share-preview'

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

test('uses the response MIME type for a downloaded dynamic OG preview', () => {
  assert.equal(resolveDownloadedImageFilename('DSC08646-preview', 'image/png', '/og/DSC08646'), 'DSC08646-preview.png')
})

test('falls back to the source URL extension when the MIME type is generic', () => {
  assert.equal(
    resolveDownloadedImageFilename('DSC08646-preview', 'application/octet-stream', photo.originalUrl),
    'DSC08646-preview.jpg',
  )
})

test('preserves supported BMP, TIFF, TIF, and HIF preview formats', () => {
  const cases = [
    ['image/bmp', '/photos/photo.bmp', 'photo-preview.bmp'],
    ['image/tiff', '/photos/photo.tiff', 'photo-preview.tiff'],
    ['application/octet-stream', '/photos/photo.tif', 'photo-preview.tif'],
    ['application/octet-stream', '/photos/photo.hif', 'photo-preview.hif'],
  ] as const

  for (const [contentType, sourceUrl, expectedFilename] of cases) {
    assert.equal(resolveDownloadedImageFilename('photo-preview', contentType, sourceUrl), expectedFilename)
  }
})
