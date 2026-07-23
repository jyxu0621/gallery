import { absoluteWithBasePath } from '../../../base-path'

export interface SharePreviewPhoto {
  id: string
  thumbnailUrl?: string | null
  originalUrl: string
}

const IMAGE_EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  'image/avif': 'avif',
  'image/gif': 'gif',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export function resolveDownloadedImageFilename(baseName: string, contentType: string, sourceUrl: string): string {
  const normalizedContentType = contentType.split(';', 1)[0].trim().toLowerCase()
  const mimeExtension = IMAGE_EXTENSION_BY_MIME_TYPE[normalizedContentType]
  if (mimeExtension) {
    return `${baseName}.${mimeExtension}`
  }

  const pathname = new URL(sourceUrl, 'https://afilmory.local').pathname
  const sourceExtension = pathname.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase()
  const supportedExtension = sourceExtension && Object.values(IMAGE_EXTENSION_BY_MIME_TYPE).includes(sourceExtension)

  return `${baseName}.${supportedExtension ? sourceExtension : 'jpg'}`
}

export function resolveSharePreviewUrl(photo: SharePreviewPhoto, origin: string, dynamicOgEnabled: boolean): string {
  const previewUrl = dynamicOgEnabled ? `/og/${photo.id}` : photo.thumbnailUrl || photo.originalUrl

  return absoluteWithBasePath(previewUrl, origin)
}
