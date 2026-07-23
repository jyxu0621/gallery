import os from 'node:os'

import { defineBuilderConfig } from '@afilmory/builder'

import { env } from './env.js'

export default defineBuilderConfig(() => ({
  storage: {
    provider: 'github',
    owner: 'jyxu0621',
    repo: 'gallery-photos',
    branch: 'main',
    path: 'photos',
    token: env.GIT_TOKEN,
    useRawUrl: true,
    maxFileLimit: 1000,
  },
  system: {
    processing: {
      defaultConcurrency: 6,
      enableLivePhotoDetection: true,
      digestSuffixLength: 0,
    },
    observability: {
      showProgress: true,
      showDetailedStats: true,
      logging: {
        verbose: false,
        level: 'info',
        outputToFile: false,
      },
      performance: {
        worker: {
          workerCount: Math.max(2, Math.min(os.cpus().length, 8)),
          timeout: 30_000,
          useClusterMode: false,
          workerConcurrency: 2,
        },
      },
    },
  },
  plugins: [],
}))
