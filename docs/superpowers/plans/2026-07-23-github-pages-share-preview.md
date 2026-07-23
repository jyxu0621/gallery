# GitHub Pages Share Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the share preview and direct photo links work in the static GitHub Pages deployment without an SSR or Cloud backend.

**Architecture:** Add a pure preview-URL selector that uses the generated thumbnail in static mode and the existing dynamic OG route only when Next or Cloud is enabled. Extract the already-present `index.html` to `404.html` copy into a tested build helper so nested GitHub Pages routes keep loading the SPA.

**Tech Stack:** TypeScript, React, Node test runner, Vite, pnpm, GitHub Actions, GitHub Pages.

## Global Constraints

- Do not add an SSR process, Afilmory Cloud backend, or external OG service.
- Preserve SSR and Cloud dynamic OG behavior.
- Preserve the existing share modal layout and 1200:628 preview frame.
- Static preview selection order is `thumbnailUrl`, then `originalUrl`.
- Keep `/gallery/` path handling centralized through `absoluteWithBasePath`.
- Fail the build if `dist/index.html` cannot be copied to `dist/404.html`.

---

### Task 1: Runtime-aware share preview URL

**Files:**
- Create: `apps/web/src/modules/social/share-preview.ts`
- Create: `apps/web/src/modules/social/share-preview.test.ts`
- Modify: `apps/web/src/modules/social/ShareModal.tsx`

**Interfaces:**
- Consumes: `absoluteWithBasePath(pathname: string, origin: string, basePath?: string): string`
- Produces: `resolveSharePreviewUrl(photo: SharePreviewPhoto, origin: string, dynamicOgEnabled: boolean): string`

- [ ] **Step 1: Write the failing preview selector tests**

Create `apps/web/src/modules/social/share-preview.test.ts`:

```ts
import assert from 'node:assert/strict'
// eslint-disable-next-line test/no-import-node-test -- GitHub Pages CI runs focused tests with `tsx --test`.
import test from 'node:test'

import { resolveSharePreviewUrl } from './share-preview'

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
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```powershell
.\node_modules\.bin\tsx.CMD --test apps/web/src/modules/social/share-preview.test.ts
```

Expected: FAIL because `./share-preview` does not exist.

- [ ] **Step 3: Implement the minimal selector**

Create `apps/web/src/modules/social/share-preview.ts`:

```ts
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
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run:

```powershell
.\node_modules\.bin\tsx.CMD --test apps/web/src/modules/social/share-preview.test.ts
```

Expected: 3 tests pass, 0 fail.

- [ ] **Step 5: Integrate the selector into the share modal**

In `apps/web/src/modules/social/ShareModal.tsx`, add:

```ts
import { resolveSharePreviewUrl } from './share-preview'
```

Replace the OG-only selection with:

```ts
const canUseDynamicOg = injectConfig.useNext || injectConfig.useCloud

const sharePreviewUrl = useMemo(
  () => resolveSharePreviewUrl(photo, resolvedBaseUrl, canUseDynamicOg),
  [
    canUseDynamicOg,
    photo.id,
    photo.originalUrl,
    photo.thumbnailUrl,
    resolvedBaseUrl,
  ],
)

const canEmbed = canUseDynamicOg
```

Rename every local `ogPreviewUrl` reference to `sharePreviewUrl`. Change the
static download filename to:

```ts
await downloadFile(sharePreviewUrl, `${photo.id}-preview.jpg`)
```

- [ ] **Step 6: Run focused tests and Web type-check**

Run:

```powershell
.\node_modules\.bin\tsx.CMD --test apps/web/base-path.test.ts apps/web/src/modules/social/share-preview.test.ts
.\node_modules\.bin\tsc.CMD --noEmit -p apps/web/tsconfig.json
```

Expected: 7 tests pass, 0 fail, and TypeScript exits 0.

- [ ] **Step 7: Commit the preview fallback**

```powershell
git add apps/web/src/modules/social/share-preview.ts apps/web/src/modules/social/share-preview.test.ts apps/web/src/modules/social/ShareModal.tsx
git commit -m "Use photo preview on static Pages"
```

### Task 2: Tested GitHub Pages SPA fallback

**Files:**
- Create: `apps/web/scripts/pages-fallback.ts`
- Create: `apps/web/scripts/pages-fallback.test.ts`
- Modify: `apps/web/scripts/build.ts`

**Interfaces:**
- Consumes: a Vite output directory containing `index.html`
- Produces: `emitPagesFallback(distDir: string): Promise<void>` and an identical `404.html`

- [ ] **Step 1: Write the failing fallback-copy test**

Create `apps/web/scripts/pages-fallback.test.ts`:

```ts
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
// eslint-disable-next-line test/no-import-node-test -- GitHub Pages CI runs focused tests with `tsx --test`.
import test from 'node:test'

import { emitPagesFallback } from './pages-fallback'

test('copies the final index document to the GitHub Pages 404 fallback', async () => {
  const distDir = await mkdtemp(path.join(tmpdir(), 'afilmory-pages-'))

  try {
    const html = '<!doctype html><base href="/gallery/">'
    await writeFile(path.join(distDir, 'index.html'), html)

    await emitPagesFallback(distDir)

    assert.equal(await readFile(path.join(distDir, '404.html'), 'utf8'), html)
  }
  finally {
    await rm(distDir, { recursive: true, force: true })
  }
})
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```powershell
.\node_modules\.bin\tsx.CMD --test apps/web/scripts/pages-fallback.test.ts
```

Expected: FAIL because `./pages-fallback` does not exist.

- [ ] **Step 3: Implement the tested fallback helper**

Create `apps/web/scripts/pages-fallback.ts`:

```ts
import { copyFile } from 'node:fs/promises'
import path from 'node:path'

export async function emitPagesFallback(distDir: string): Promise<void> {
  await copyFile(path.resolve(distDir, 'index.html'), path.resolve(distDir, '404.html'))
}
```

- [ ] **Step 4: Use the helper from the production build**

In `apps/web/scripts/build.ts`, remove the direct `copyFile` import, import:

```ts
import { emitPagesFallback } from './pages-fallback'
```

Then replace the existing copy with:

```ts
await emitPagesFallback(path.resolve(workdir, 'dist'))
```

- [ ] **Step 5: Run the fallback test and verify GREEN**

Run:

```powershell
.\node_modules\.bin\tsx.CMD --test apps/web/scripts/pages-fallback.test.ts
```

Expected: 1 test passes, 0 fail.

- [ ] **Step 6: Commit the tested build fallback**

```powershell
git add apps/web/scripts/build.ts apps/web/scripts/pages-fallback.ts apps/web/scripts/pages-fallback.test.ts
git commit -m "Test GitHub Pages SPA fallback"
```

### Task 3: Full verification and deployment

**Files:**
- Verify all files from Tasks 1 and 2.
- Publish the resulting commits to `jyxu0621/gallery` on `main`.

**Interfaces:**
- Consumes: static preview selection and the built `404.html`
- Produces: a deployed GitHub Pages gallery with working preview images and direct photo URLs

- [ ] **Step 1: Run all focused regression tests**

Run:

```powershell
.\node_modules\.bin\tsx.CMD --test apps/web/base-path.test.ts apps/web/src/modules/social/share-preview.test.ts apps/web/scripts/pages-fallback.test.ts
```

Expected: 8 tests pass, 0 fail.

- [ ] **Step 2: Run Web type-check**

Run:

```powershell
.\node_modules\.bin\tsc.CMD --noEmit -p apps/web/tsconfig.json
```

Expected: TypeScript exits 0.

- [ ] **Step 3: Run the production Web build**

Run from `apps/web`:

```powershell
..\..\node_modules\.bin\tsx.CMD scripts/build.ts
```

Expected: Vite exits 0 and both `dist/index.html` and `dist/404.html` exist.

- [ ] **Step 4: Verify the fallback documents are identical**

Run:

```powershell
$indexHash = (Get-FileHash apps/web/dist/index.html -Algorithm SHA256).Hash
$fallbackHash = (Get-FileHash apps/web/dist/404.html -Algorithm SHA256).Hash
if ($indexHash -ne $fallbackHash) { throw 'GitHub Pages fallback differs from index.html' }
```

Expected: command exits 0.

- [ ] **Step 5: Run the repository pre-commit checks**

Run:

```powershell
.\node_modules\.bin\lint-staged.CMD
```

Expected: Prettier and ESLint complete without errors.

- [ ] **Step 6: Push the fast-forward result to GitHub main**

```powershell
git fetch origin main
git rebase origin/main
git push origin HEAD:main
```

Expected: GitHub accepts a fast-forward update and triggers
`Build and deploy gallery`.

- [ ] **Step 7: Verify GitHub Actions**

Inspect the latest run for:

```text
https://github.com/jyxu0621/gallery/actions/workflows/deploy-pages.yml
```

Expected: `Build and deploy gallery` concludes `success` for the implementation
commit.

- [ ] **Step 8: Verify production behavior**

Open:

```text
https://jyxu0621.github.io/gallery/photos/DSC08646
```

Expected:

- the SPA photo page renders through the custom `404.html`;
- the share link is `https://jyxu0621.github.io/gallery/photos/DSC08646`;
- the share preview image uses `/gallery/thumbnails/DSC08646.jpg` or the
  original photo URL;
- no request is made to `/gallery/og/DSC08646` in static mode.
