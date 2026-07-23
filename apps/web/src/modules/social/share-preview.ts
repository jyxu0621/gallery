import { absoluteWithBasePath } from '../../../base-path'

export interface SharePreviewPhoto {
  id: string
  thumbnailUrl?: string | null
  originalUrl: string
}

export function resolveSharePreviewUrl(
  photo: SharePreviewPhoto,
  origin: string,
  dynamicOgEnabled: boolean,
): string {
  const previewUrl = dynamicOgEnabled
    ? `/og/${photo.id}`
    : photo.thumbnailUrl || photo.originalUrl

  return absoluteWithBasePath(previewUrl, origin)
}
