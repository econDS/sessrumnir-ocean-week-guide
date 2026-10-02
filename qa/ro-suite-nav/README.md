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

The real pre-edit run [36959399222](https://github.com/econDS/sessrumnir-ocean-week-guide/actions/runs/36959399222) passed **2,025 browser checks** on QA-only source commit `5b27636096fdb6a2f1d30a9af1b64eb9e570e112`. Production docs still exactly matched base master. All eight width/OS-theme scenarios had zero document overflow and no page errors, console errors/warnings, failed requests, or HTTP errors. Each scenario exercised 75 copy targets through both clipboard API paths, 29 images with three lightbox dismissal methods, original links, and the details disclosure. [Complete artifact](https://github.com/econDS/sessrumnir-ocean-week-guide/actions/runs/36959399222/artifacts/11207417689); the same JSON is retained as `baseline.json.gz` (uncompressed SHA-256 `b396e7df0893ba0de9861a4ccd7adafdf3af0730485320913eefdf95bd90bd9c`).

An earlier QA-only attempt correctly exposed an unsettled horizontal table-scroll position after automated clicks. The harness now restores nested scroll positions before geometry comparisons; no production code was changed to address this harness issue.

## Integration

The only change to original production bytes is the light-themed component and local module placed before/outside `.page`, plus one `ro-suite-nav > nav > a` fallback hit-area rule. The header, global styles, body padding, guide code, rewards, dates, commands and all existing assets remain byte-for-byte preserved after removing those exact additions. All three release files were downloaded from portal tag `nav-v1.2.0` and checked against the requested SHA-256 values; the bundle and catalog also match `nav.lock.json`. The upstream lock identifies source commit `a3966bdda412f05b0756b5d139915e44894c0ee0` and includes its own source-working-tree caveat.

## Verified integration results

[Integration CI 36960038277](https://github.com/econDS/sessrumnir-ocean-week-guide/actions/runs/36960038277) passed on source commit `faef0b2e7ae184d94511ae79bdadd43216d612d0`: **5 static tests and 6,137 browser checks**, with no failures. The [full report/log/screenshots artifact](https://github.com/econDS/sessrumnir-ocean-week-guide/actions/runs/36960038277/artifacts/11207861763) contains 24 scenarios and 40 genuine screenshots. [Machine-readable evidence summary](evidence-summary.json).

- Widths 360, 390, 768, 1440; light and dark OS schemes; original, installed, and actual-request-blocked nav modes
- Zero document overflow in every scenario; no changes to original element geometry beyond the intended vertical shift; no nav/header overlap
- Exact 75 copy targets through both exhaustive instrumented copy paths in each scenario; eight route-row COPY buttons included; ordered arrays and all source guide bytes unchanged. No aggregate controls exist to click
- All 29 image instances opened and dismissed with Escape, image click, and backdrop click; all original links and disclosure click/Enter/Space flows preserved
- Tab/Enter/Space/Escape, focus return, Tab-out dismissal, Ocean aria-current, teal wave identity, planned unlinked Grade & Refine, and every nav target at least 44×44
- Actual installed nav.js request blocked: visible keyboard-usable fallback link at least 44×44; guide copies/images/disclosure still work
- Light-only guide and theme=light nav unchanged after OS-theme transitions; URL query/hash and storage sentinel unchanged; no new keys
- Zero new console errors/warnings, page errors, HTTP errors, or failed requests. Only the intentionally aborted nav.js failure is classified as expected in blocked-script scenarios

### Real screenshots

All four images below were captured at scroll X/Y = 0, after layout settled, from `faef0b2e7ae184d94511ae79bdadd43216d612d0`. They are original Chromium PNGs, not mockups or crops. The later evidence/test commit leaves production files unchanged. The PR links a fresh CI run for its exact final head, including freshly generated screenshots in that run's artifact.

- [Mobile menu open, 390×900, light OS](screenshots/normal-390-light-menu-open.png)
- [Desktop menu open, 1440×900, dark OS with light guide/nav](screenshots/normal-1440-dark-menu-open.png)
- [Mobile fallback with nav.js blocked, visible Portal link](screenshots/fallback-390-light-fallback-visible.png)
- [Desktop fallback with nav.js blocked, visible Portal link](screenshots/fallback-1440-dark-fallback-visible.png)

### Final-head additions and remaining limits

The final workflow requires the integration to be present and runs comparison mode; removing the host cannot silently switch CI to baseline-only. The final test runner additionally checks the three served release assets by HTTP status, exact bytes and SHA-256, and adds native Chromium clipboard smoke at 390/light and 1440/dark across original/installed/blocked modes. Native smoke uses three representative controls through real writeText and real execCommand fallback (36 actual clipboard reads); exhaustive 75-target output comparisons remain separately instrumented. These added checks must pass in the exact-final-head CI linked from the PR; the historical 6,137-check run above predates these additions.

Only Chromium on Linux was exercised, using viewport emulation rather than physical devices. Firefox, WebKit/Safari, physical-device clipboard integration, and screen-reader speech output were not tested. External destination navigations are locally intercepted to prove exact URLs/keyboard activation, so those flows do not establish live third-party page availability. The Portal URL separately returned HTTP 200 before installation. Optional remote catalog fetching is intentionally unconfigured. No deployed-site test is claimed; this is a Draft PR with no merge, deployment, or Pages-settings change.

## Rollback

Revert only the eight integration lines in `docs/index.html` and remove `docs/assets/ro-suite/1.2.0/`; keep all original guide content and logic unchanged. No storage migration or cleanup is needed.
