# Splash Subtitle Repair Design

## Problem

The first-load splash screen renders `????????` beneath “Xiaoxu Photography” because `config.json` contains that literal corrupted value as the site description.

## Design

- Replace the corrupted description with `记录光影与旅途`.
- Keep the existing splash layout, typography, timing, and animation unchanged.
- Continue using the shared site description so the splash screen and generated page metadata remain consistent.

## Verification

- Add a focused test that loads `config.json` and rejects placeholder question-mark descriptions.
- Run the focused test and the Web TypeScript check before deployment.
