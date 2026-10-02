# Ocean Week navigation QA

## Scope and baseline

Base master: `71417fee17a5732aacf8db81933359aeb2f5fad3`.
Publishing root: `docs/`; tested public path: `/sessrumnir-ocean-week-guide/` (without `/docs/`).
The original repository has no tracked `AGENTS.md`, `.agents/skills`, package manifest, tests, or CI workflow. Its README identifies `docs/` as the publishing root. No Pages settings are changed.

Before production edits, `node tests/capture-ocean-baseline.cjs` captured `source-baseline.json`: hashes of every original publishing file, exact ordered single-copy values, all three navigation arrays, main-page content, event dates, NPC order, links, images, inline script/style hashes, and storage/URL references. The original UI has 75 single-copy targets (67 data-copy buttons plus 8 route rows with COPY buttons) and **zero aggregate-copy controls**; the unused aggregate event handler and arrays are preserved. Daily Quest 4 starts at Lifeguard (`213/120`), followed by the three separate random destinations. Event dates are historical source content and are unchanged; this integration makes no claim that the event is currently active.

The original page is light-only, with no theme toggle, app storage keys, share links, or query/hash parser. Its baseline also includes 29 zoomable image instances, three external guide links, and the extra-quests disclosure.

## Commands and CI

- Source capture (run only against unmodified base): `node tests/capture-ocean-baseline.cjs`
- Source/integrity regression: `node --test tests/*.test.cjs`
- Pre-integration browser capture: `BASELINE_ONLY=1 BASE_DOCS=/path/to/base/docs node tests/ro-suite-nav.browser.cjs`
- Final browser comparison: `BASE_DOCS=/path/to/base/docs node tests/ro-suite-nav.browser.cjs`

Browser tooling is pinned to Playwright 1.55.1 (Chromium); CI installs it outside the checkout. The PR-only workflow targets `master`, checks out the exact PR head with `persist-credentials: false`, uses only `contents: read`, and uploads reports/logs/screenshots even on failure. It has no deploy, push, or Pages steps. Actions are pinned to commit SHAs.

Local source checks can run. Local Chromium cannot start because the sandbox denies its singleton socket (`socket() failed: Operation not permitted`); browser claims come only from real GitHub Actions execution.

## Evidence status

Initial baseline execution pending. Browser reports record source commit, base commit, viewport/OS scheme, error inventories, interactions and screenshot filenames. Reports and images are retained as run artifacts, with selected evidence linked here after successful execution.
