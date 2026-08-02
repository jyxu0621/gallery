import assert from 'node:assert/strict'
// eslint-disable-next-line test/no-import-node-test -- GitHub Pages CI runs this file with `tsx --test`.
import test from 'node:test'

import {
  absoluteWithBasePath,
  GALLERY_BASE_PATH,
  normalizeBasePath,
  rewriteManifestUrls,
  routerBasePath,
  withBasePath,
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

test('builds absolute URLs with the deployment base path', () => {
  assert.equal(
    absoluteWithBasePath('/og/DSC08432', 'https://jyxu0621.github.io'),
    'https://jyxu0621.github.io/gallery/og/DSC08432',
  )
  assert.equal(
    absoluteWithBasePath('/photos/DSC08432', 'http://127.0.0.1:4173'),
    'http://127.0.0.1:4173/gallery/photos/DSC08432',
  )
  assert.equal(absoluteWithBasePath('/og/DSC08432', 'https://example.com', '/'), 'https://example.com/og/DSC08432')
  assert.equal(
    absoluteWithBasePath('/?tags=%E5%8C%97%E4%BA%AC', 'https://jyxu0621.github.io'),
    'https://jyxu0621.github.io/gallery/?tags=%E5%8C%97%E4%BA%AC',
  )
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

test('moves generated thumbnails to the image CDN when a storage key is available', () => {
  const manifest = {
    data: [
      {
        id: 'nested-photo',
        s3Key: '旅行/Xiaomi 13.jpg',
        thumbnailUrl: '/thumbnails/nested-photo.jpg',
        originalUrl: '/photos/nested-photo.jpg',
      },
    ],
  }

  const rewritten = rewriteManifestUrls(manifest)

  assert.equal(
    rewritten.data[0].thumbnailUrl,
    'https://cdn.51shang.top/photos/%E6%97%85%E8%A1%8C/Xiaomi%2013.jpg',
  )
  assert.equal(
    rewritten.data[0].originalUrl,
    'https://cdn.51shang.top/photos/%E6%97%85%E8%A1%8C/Xiaomi%2013.jpg',
  )
  assert.equal(manifest.data[0].thumbnailUrl, '/thumbnails/nested-photo.jpg')
})
