# GitHub Pages Static Share Preview Fix

## Problem

The gallery runs as a static SPA under
`https://jyxu0621.github.io/gallery/`. GitHub Pages cannot serve Afilmory's
dynamic `/og/:photoId` endpoint, so an OG preview URL returns `404` even when
the `/gallery` base path is correct.

Direct photo links such as `/gallery/photos/DSC08646` also return GitHub
Pages' default `404` response unless the deployment includes an SPA fallback.

## Deployment Mode

This design targets the current GitHub Pages deployment:

- no SSR process;
- no Afilmory Cloud backend;
- no external image-generation service;
- photo metadata and thumbnails are generated during GitHub Actions.

SSR and Cloud behavior remains unchanged.

## Design

### Static preview image

The share modal will select its preview source by runtime capability:

- SSR or Cloud mode: use the existing `/og/:photoId` URL;
- static GitHub Pages mode: use `photo.thumbnailUrl`, falling back to
  `photo.originalUrl`.

The preview remains inside the existing 1200:628 display frame and uses
`object-cover`. Downloading the preview in static mode downloads the selected
photo asset rather than requesting the unavailable OG endpoint.

### Direct photo-link fallback

After the Web production build completes, the build process will copy
`dist/index.html` to `dist/404.html`.

GitHub Pages serves that document for unknown photo paths. The SPA then reads
the browser pathname and renders the existing photo route. All asset URLs
remain rooted at `/gallery/`, so the fallback document can load from nested
paths.

### URL construction

The existing `absoluteWithBasePath` helper remains the single source of truth
for absolute local URLs. The share link stays
`https://jyxu0621.github.io/gallery/photos/:photoId`.

Static preview URLs that are already remote or already contain `/gallery/`
continue to pass through unchanged.

## Data Flow

1. GitHub Actions generates the photo manifest and thumbnails.
2. Vite builds the static SPA with `/gallery/` as its base path.
3. The build creates `dist/404.html` from the final `dist/index.html`.
4. The share modal detects that neither SSR nor Cloud mode is enabled.
5. The modal displays the photo thumbnail or original image as its preview.
6. A visitor opening a shared nested photo URL receives `404.html`, after
   which the SPA resolves the photo route.

## Error Handling

- If `thumbnailUrl` is unavailable, use `originalUrl`.
- If the selected image still fails, preserve the current loading-state
  cleanup so the modal does not remain stuck on a spinner.
- If `dist/index.html` is missing, the fallback generation step must fail the
  build rather than silently deploy without `404.html`.

## Testing

Add focused tests for:

- static mode choosing `thumbnailUrl`;
- static mode falling back to `originalUrl`;
- SSR or Cloud mode choosing the base-path-aware OG URL;
- the production build emitting `dist/404.html`;
- `dist/404.html` matching the final `dist/index.html`.

Run the existing base-path test, Web type-check, production build, and GitHub
Pages workflow. After deployment, verify:

- the share modal preview loads a real image;
- the displayed share link contains `/gallery/photos/`;
- directly opening a shared photo URL loads the SPA;
- `/gallery/og/:photoId` is no longer requested in static mode.

## Scope

No visual redesign, social-provider change, external service, or per-photo OG
card generation is included. The change only makes the existing share
experience functional on GitHub Pages.
