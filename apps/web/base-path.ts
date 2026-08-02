export const GALLERY_BASE_PATH = '/gallery/'
export const GALLERY_IMAGE_CDN = 'https://cdn.51shang.top/photos'

export function normalizeBasePath(basePath: string): string {
  const trimmed = basePath.trim()
  if (!trimmed || trimmed === '/') {
    return '/'
  }
  return `/${trimmed.replace(/^\/+|\/+$/g, '')}/`
}

export function routerBasePath(basePath = GALLERY_BASE_PATH): string {
  const normalized = normalizeBasePath(basePath)
  return normalized === '/' ? '/' : normalized.slice(0, -1)
}

export function withBasePath(url: string, basePath = GALLERY_BASE_PATH): string {
  if (!url.startsWith('/') || url.startsWith('//')) {
    return url
  }

  const normalizedBase = normalizeBasePath(basePath)
  if (normalizedBase === '/') {
    return url
  }
  if (url === normalizedBase.slice(0, -1) || url.startsWith(normalizedBase)) {
    return url
  }

  return `${normalizedBase.slice(0, -1)}${url}`
}

export function absoluteWithBasePath(pathname: string, origin: string, basePath = GALLERY_BASE_PATH): string {
  if (!origin) {
    return withBasePath(pathname, basePath)
  }
  return new URL(withBasePath(pathname, basePath), `${origin.replace(/\/+$/, '')}/`).toString()
}

type ManifestPhoto = {
  thumbnailUrl?: string | null
  originalUrl?: string | null
  s3Key?: string | null
}

type ManifestShape = {
  data?: ManifestPhoto[]
}

function isRemoteUrl(url: string): boolean {
  return /^(?:https?:)?\/\//i.test(url)
}

function withImageCdn(key: string, imageCdn = GALLERY_IMAGE_CDN): string {
  const normalizedKey = key.replace(/^\/+/, '').replace(/^photos\//i, '')
  const encodedPath = normalizedKey.split('/').map(encodeURIComponent).join('/')
  return `${imageCdn.replace(/\/+$/, '')}/${encodedPath}`
}

export function rewriteManifestUrls<T extends ManifestShape>(manifest: T, basePath = GALLERY_BASE_PATH): T {
  const rewritten = structuredClone(manifest)

  for (const photo of rewritten.data ?? []) {
    if (photo.thumbnailUrl) {
      photo.thumbnailUrl =
        photo.s3Key && !isRemoteUrl(photo.thumbnailUrl)
          ? withImageCdn(photo.s3Key)
          : withBasePath(photo.thumbnailUrl, basePath)
    }
    if (photo.originalUrl) {
      photo.originalUrl =
        photo.s3Key && !isRemoteUrl(photo.originalUrl)
          ? withImageCdn(photo.s3Key)
          : withBasePath(photo.originalUrl, basePath)
    }
  }

  return rewritten
}
