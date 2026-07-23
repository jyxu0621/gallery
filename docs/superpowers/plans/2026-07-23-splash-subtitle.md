# Splash Subtitle Repair Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the corrupted first-load subtitle with `摄影、飞行、风光、旅途`.

**Architecture:** Keep `config.json` as the single source of truth for the site description. Add a focused configuration test so corrupted question-mark placeholders cannot silently return.

**Tech Stack:** JSON, Node.js built-in test runner, `tsx`

## Global Constraints

- The exact subtitle is `摄影、飞行、风光、旅途`.
- Do not change the splash layout, typography, timing, or animation.
- Keep the splash screen and generated metadata sourced from the same `description` field.

---

### Task 1: Repair and guard the site description

**Files:**
- Modify: `config.json`
- Create: `apps/web/site-config.test.ts`

**Interfaces:**
- Consumes: `config.json` with a top-level `description` string.
- Produces: A valid Chinese site description consumed by Vite's HTML template injection.

- [ ] **Step 1: Write the failing test**

```ts
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('uses the approved Chinese site description instead of a corrupted placeholder', async () => {
  const config = JSON.parse(await readFile(new URL('../../config.json', import.meta.url), 'utf8'))

  assert.equal(config.description, '摄影、飞行、风光、旅途')
  assert.doesNotMatch(config.description, /^\?+$/)
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec tsx --test apps/web/site-config.test.ts`

Expected: FAIL because the current description is `????????`.

- [ ] **Step 3: Write the minimal implementation**

```json
{
  "description": "摄影、飞行、风光、旅途"
}
```

Preserve every other existing field in `config.json`.

- [ ] **Step 4: Run focused and regression verification**

Run:

```bash
pnpm exec tsx --test apps/web/site-config.test.ts apps/web/base-path.test.ts apps/web/src/modules/social/share-preview.test.ts apps/web/scripts/pages-fallback.test.ts
pnpm --filter @afilmory/web type-check
```

Expected: 11 tests pass and TypeScript exits with code 0.

- [ ] **Step 5: Commit**

```bash
git add config.json apps/web/site-config.test.ts
git commit -m "Fix splash subtitle"
```
