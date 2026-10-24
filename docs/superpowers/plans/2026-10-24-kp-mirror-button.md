# Kinopoisk → kinokino.vip Button Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chrome extension that puts a ▶ button before the film title on Kinopoisk film/series pages; clicking it opens the same path on kinokino.vip in the current tab.

**Architecture:** Two content-script files sharing one global scope: `src/url.js` (pure URL mapping) and `src/content.js` (DOM injection + MutationObserver + URL-change polling). `src/styles.css` styles the button. Logic is exported via `globalThis.KPM` in the browser and `module.exports` in Node so tests run without Chrome.

**Tech Stack:** Chrome Manifest V3, vanilla JS, Node `node:test`, `jsdom` (dev only).

**Spec:** `docs/superpowers/specs/2026-10-24-kp-mirror-button-design.md`

## Global Constraints
- Mirror origin: `https://kinokino.vip` (exact).
- Matched paths: `/film/<digits>/…` and `/series/<digits>/…` only.
- Query string and hash are dropped; path is kept as `/<type>/<id>/`.
- Navigation in the current tab (`location.assign`).
- No permissions in manifest beyond content-script host matches.
- Button element id: `kpm-play`; fallback class `kpm-floating`.

## Review Focus
1. Client-side navigation film A → film B: button must point to B (handler reads `location.href` at click time, not at injection time). Test in Task 2.
2. Re-render of the title by the page: button re-appears exactly once (observer + idempotent `ensureButton`). Test in Task 2.
3. Navigation from film page to a non-film page: button removed. Test in Task 2.
4. Sub-pages like `/film/123/cast/`: still map to `/film/123/`. Test in Task 1.
5. Title text must not change (button is an SVG with `aria-label`, no text nodes). Test in Task 2.

---

### Task 1: URL mapping

**Files:**
- Create: `src/url.js`, `test/url.test.js`, `package.json`

**Interfaces:**
- Produces: `parseFilmPath(href: string) -> {type: 'film'|'series', id: string} | null`; `toMirrorUrl(href: string) -> string | null`.

- [ ] Step 1: tests:
  - `toMirrorUrl('https://www.kinopoisk.ru/film/5301021/?socialAlias=MjcwMzAwMTg%3D')` === `'https://kinokino.vip/film/5301021/'`
  - `toMirrorUrl('https://www.kinopoisk.ru/series/464963/')` === `'https://kinokino.vip/series/464963/'`
  - `toMirrorUrl('https://www.kinopoisk.ru/film/123/cast/#x')` === `'https://kinokino.vip/film/123/'`
  - `toMirrorUrl('https://kinopoisk.ru/film/77')` === `'https://kinokino.vip/film/77/'`
  - `null` for `https://www.kinopoisk.ru/`, `/name/123/`, `/film/abc/`, `https://example.com/film/1/`
- [ ] Step 2: `npm test` → FAIL (module missing).
- [ ] Step 3: implement with `new URL`, host check `kinopoisk.ru` / `*.kinopoisk.ru`, regex `^/(film|series)/(\d+)(/|$)`.
- [ ] Step 4: `npm test` → PASS.
- [ ] Step 5: commit.

### Task 2: Button injection

**Files:**
- Create: `src/content.js`, `src/styles.css`, `test/content.test.js`

**Interfaces:**
- Consumes: `KPM.toMirrorUrl`.
- Produces: `KPM.ensureButton(doc: Document, href: string) -> void`; `KPM.start(win: Window) -> void` (observer + 500 ms URL poll, auto-run in browser only).

- [ ] Step 1: tests (jsdom):
  - film page with `<h1>Моана (2026)</h1>` → `h1.firstChild.id === 'kpm-play'`, `h1.textContent === 'Моана (2026)'`.
  - calling `ensureButton` twice → exactly one `#kpm-play`.
  - no `h1` → one `#kpm-play.kpm-floating` in `body`.
  - `h1` appears later → floating button replaced by in-title button.
  - non-film href → `#kpm-play` removed.
  - click handler navigates to `toMirrorUrl(current location)` (inject an `assign` spy).
- [ ] Step 2: run → FAIL.
- [ ] Step 3: implement. Title lookup: `h1[itemprop="name"]`, then first visible `h1` in `main`/`body`. Button inserted as first child of `h1` (inline-flex, vertical-align middle, margin-right). SVG play icon, `aria-label="Смотреть на kinokino.vip"`, `title` same. Click: `preventDefault`, `stopPropagation`, `location.assign(toMirrorUrl(location.href))`.
- [ ] Step 4: run → PASS.
- [ ] Step 5: commit.

### Task 3: Manifest, icons, live check

**Files:**
- Create: `manifest.json`, `icons/icon16.png`, `icons/icon48.png`, `icons/icon128.png`, `README.md`

- [ ] Step 1: manifest MV3, name «Кинопоиск → kinokino.vip», `content_scripts` matches `https://www.kinopoisk.ru/*`, `https://kinopoisk.ru/*`, js `[src/url.js, src/content.js]`, css `[src/styles.css]`, `run_at: document_idle`.
- [ ] Step 2: generate icons (play triangle on orange circle).
- [ ] Step 3: validate manifest JSON + run all tests.
- [ ] Step 4: live check of the real page's title markup if a browser is reachable; adjust selector.
- [ ] Step 5: zip `kp-mirror.zip`, commit.
