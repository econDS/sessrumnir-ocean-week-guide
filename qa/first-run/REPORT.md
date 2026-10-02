# Ocean Week first-run UX

## Baseline and scope
Base: `01e356ade26cb4f80c70dc3e75882cca79aa30b9`, clean `master`, publishing `docs/` at `/sessrumnir-ocean-week-guide/`. Original checkout was archived before edits and its 9 Node checks passed. Before screenshots/browser outputs are from that immutable archive; candidate screenshots are tied to the index SHA in `local-results.json`.

Before: archive hero → Official link → expanded story → warp utility. Zero form inputs; no task jump navigation. After: archive hero → four task jumps → utility. Lore is a native collapsed details, retained in full. Existing four section titles gained fragment IDs; original URLs and copy handlers remain unchanged.

## Actual local verification
- `node --test tests/*.test.cjs`: 11 passed
- `NODE_PATH=… BASE_DOCS=… node tests/ro-suite-nav.browser.cjs`: 6,230 passed, zero failures; 24 viewport/theme/fallback scenarios and 46 screenshots
- `NODE_PATH=… BASE_DOCS=… node tests/first-run.browser.cjs`: all 360/390/768/1440 checks passed; actual before/after viewport screenshots
- Every original copy target, command array, image/lightbox and live clipboard smoke preserved; archive notice/period/caveat unchanged
- Native jump links activate with Enter; lore toggles with Space; four links are at least44px high; no new horizontal overflow
- `changes.json` reverses the exact presentation-only delta to the whole original HTML hash; historical source invariant tests use that inverse, without relaxing game-data or executable-script byte checks

## Evidence
See `local-results.json`, `screenshots/`, and final-head read-only PR CI artifacts. First task cue remains in the first900px viewport at all four widths. At390px first copy moved earlier; no claim of measured human usability or conversion improvement.

## Limitations
No real-device, Firefox, WebKit, or post-merge Pages testing. External official page availability/game data not reverified. QA destination fixtures validate exact links rather than remote child calculators. Shared nav1.3 remains byte-identical.

## Rollback
Revert this feature commit; no stored-state or content migration required. Draft PR only; no deployment or merge requested.
