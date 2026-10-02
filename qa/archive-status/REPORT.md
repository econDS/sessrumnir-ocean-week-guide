# Ocean archive status QA

Base: `e2d407699d5a8fc5a37b91ffec1071df9bf41471`, clean `master`, publishing `docs/`, public URL https://econds.github.io/sessrumnir-ocean-week-guide/. Baseline captured before editing in baseline.json and baseline-tests.log (6 tests passed).

Production change: two copy replacements and one archive-only contrast rule in the existing header: archive badge, ended-period statement, future-rerun caveat and guide usage copy. No other CSS, script, quest/NPC/reward data, /navi command, image, navigation artifact, date, storage or URL behavior changes. Existing header layout and semantic static paragraphs reused. Archive text alone uses an opaque #07385e background with white foreground (contrast tested above 4.5:1). No live region.

Commands: `node --test tests/*.test.cjs` (9 passed locally), `node tests/ro-suite-nav.browser.cjs` (actual final-head PR CI results linked from PR). The browser comparison runs the immutable base first, then candidate and blocked-module variants at 360/390/768/1440 in light/dark system settings. Existing 75 copy targets, 29 zoom images and all link/disclosure behavior remain covered. Comparison excludes only approved copy text and expected vertical shift from the larger header; all other geometry, content, scripts and assets remain guarded. New checks require all archive statements above the fold, no overflow, static semantics.

Read-only PR CI installs pinned QA-only Playwright 1.55.1. Logs, source SHA and screenshots remain artifacts even on failure. No push/deploy or Pages step. Historical nav rollout evidence is not reused as new browser evidence.

Not verified: physical phones, WebKit/Firefox, actual game behavior or future reruns. Link health is separate from game data verification. No new game-data verification asserted. Rollback: revert this copy-only feature commit; no storage migration.
