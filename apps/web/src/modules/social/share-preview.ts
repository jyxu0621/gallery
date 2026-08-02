import { absoluteWithBasePath } from '../../../base-path'

export const DEFAULT_SHARE_PREVIEW_ASPECT_RATIO = 1200 / 628

export interface SharePreviewPhoto {
  id: string
  thumbnailUrl?: string | null
  originalUrl: string
}

export function resolveSharePreviewAspectRatio(
  width: number,
  height: number,
  fallback = DEFAULT_SHARE_PREVIEW_ASPECT_RATIO,
): number {
  return Number.isFinite(width) && width > 0 && Number.isFinite(height) && height > 0 ? width / height : fallback
}

const IMAGE_EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  'image/avif': 'avif',
  'image/bmp': 'bmp',
  'image/gif': 'gif',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/tiff': 'tiff',
  'image/webp': 'webp',
  'image/x-ms-bmp': 'bmp',
  'image/x-tiff': 'tiff',
}

const SUPPORTED_SOURCE_EXTENSIONS = new Set([
  'avif',
  'bmp',
  'gif',
  'heic',
  'heif',
  'hif',
  'jpeg',
  'jpg',
  'png',
  'tif',
  'tiff',
  'webp',
])

export function resolveDownloadedImageFilename(baseName: string, contentType: string, sourceUrl: string): string {
  const normalizedContentType = contentType.split(';', 1)[0].trim().toLowerCase()
  const mimeExtension = IMAGE_EXTENSION_BY_MIME_TYPE[normalizedContentType]
  if (mimeExtension) {
    return `${baseName}.${mimeExtension}`
  }

  const pathname = new URL(sourceUrl, 'https://afilmory.local').pathname
  const sourceExtension = pathname.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase()
  const supportedExtension = sourceExtension && SUPPORTED_SOURCE_EXTENSIONS.has(sourceExtension)

  return `${baseName}.${supportedExtension ? sourceExtension : 'jpg'}`
}

export function resolveSharePreviewUrl(photo: SharePreviewPhoto, origin: string, dynamicOgEnabled: boolean): string {
  const previewUrl = dynamicOgEnabled ? `/og/${photo.id}` : photo.thumbnailUrl || photo.originalUrl

  return absoluteWithBasePath(previewUrl, origin)
}
