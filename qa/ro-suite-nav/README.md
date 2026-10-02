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

Final integration browser execution is pending. Browser reports record source/base commits, viewport/OS scheme, error inventories, real interactions and screenshot filenames. Selected screenshots and final results will be linked here after successful execution.
