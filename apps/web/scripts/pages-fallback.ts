import { copyFile } from 'node:fs/promises'
import path from 'node:path'

export async function emitPagesFallback(distDir: string): Promise<void> {
  await copyFile(path.resolve(distDir, 'index.html'), path.resolve(distDir, '404.html'))
}
