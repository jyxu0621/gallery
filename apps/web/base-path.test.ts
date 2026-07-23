import assert from 'node:assert/strict'
import test from 'node:test'

import {
  GALLERY_BASE_PATH,
  normalizeBasePath,
  routerBasePath,
  withBasePath,
  rewriteManifestUrls,
} from './base-path'

test('normalizes the GitHub Pages project base path', () => {
  assert.equal(GALLERY_BASE_PATH, '/gallery/')
  assert.equal(normalizeBasePath('gallery'), '/gallery/')
  assert.equal(normalizeBasePath('/gallery/'), '/gallery/')
  assert.equal(routerBasePath('/gallery/'), '/gallery')
})

test('prefixes only local root-relative URLs', () => {
  assert.equal(withBasePath('/thumbnails/photo.jpg'), '/gallery/thumbnails/photo.jpg')
  assert.equal(withBasePath('/gallery/feed.xml'), '/gallery/feed.xml')
  assert.equal(withBasePath('https://example.com/photo.jpg'), 'https://example.com/photo.jpg')
  assert.equal(withBasePath('data:image/png;base64,abc'), 'data:image/png;base64,abc')
})

test('rewrites local thumbnail URLs without changing remote originals', () => {
  const manifest = {
    data: [
      {
        id: 'one',
        thumbnailUrl: '/thumbnails/one.jpg',
        originalUrl: 'https://raw.githubusercontent.com/jyxu0621/gallery-photos/main/photos/one.jpg',
      },
    ],
  }

  const rewritten = rewriteManifestUrls(manifest)

  assert.equal(rewritten.data[0].thumbnailUrl, '/gallery/thumbnails/one.jpg')
  assert.equal(
    rewritten.data[0].originalUrl,
    'https://raw.githubusercontent.com/jyxu0621/gallery-photos/main/photos/one.jpg',
  )
  assert.equal(manifest.data[0].thumbnailUrl, '/thumbnails/one.jpg')
})
