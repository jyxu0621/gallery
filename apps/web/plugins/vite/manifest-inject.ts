import { readFileSync } from 'node:fs'

import type { Plugin } from 'vite'

import { rewriteManifestUrls } from '../../base-path'
import { MANIFEST_PATH } from './__internal__/constants'

function resolveEmbedPreference(_command: 'serve' | 'build'): boolean {
  const flag = process.env.AFILMORY_EMBED_MANIFEST?.trim().toLowerCase()
  if (flag === 'true') return true
  if (flag === 'false') return false
  return true
}

export function manifestInjectPlugin(): Plugin {
  let embedManifest: boolean | undefined

  function getManifestContent(): string {
    try {
      const content = readFileSync(MANIFEST_PATH, 'utf-8')
      return JSON.stringify(rewriteManifestUrls(JSON.parse(content)))
    } catch (error) {
      console.warn('Failed to read manifest file:', error)
      return '{}'
    }
  }

  return {
    name: 'manifest-inject',

    configResolved(config) {
      embedManifest = resolveEmbedPreference(config.command as 'serve' | 'build')
    },

    configureServer(server) {
      const shouldEmbed = embedManifest ?? resolveEmbedPreference(server.config.command as 'serve')
      if (!shouldEmbed) {
        return
      }

      // ?? manifest ????
      server.watcher.add(MANIFEST_PATH)

      server.watcher.on('change', (file) => {
        if (file === MANIFEST_PATH) {
          console.info('[manifest-inject] Manifest file changed, triggering HMR...')
          // ????????
          server.ws.send({
            type: 'full-reload',
          })
        }
      })
    },

    transformIndexHtml(html, ctx) {
      const command: 'serve' | 'build' = ctx?.server ? 'serve' : 'build'
      const shouldEmbed = embedManifest ?? resolveEmbedPreference(command)
      embedManifest = shouldEmbed
      if (!shouldEmbed) {
        return html
      }

      const manifestContent = getManifestContent()

      // ? manifest ????? script#manifest ???
      const scriptContent = `window.__MANIFEST__ = ${manifestContent};`

      return html.replace('<script id="manifest"></script>', `<script id="manifest">${scriptContent}</script>`)
    },
  }
}
