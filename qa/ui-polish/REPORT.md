# Ocean Week guide — UI polish (items 1–3)

Presentation only. Guide data, `/navi` commands, scripts and existing styles are unchanged; the delta is a reversible pair list (`changes.json`) plus one new `<style id="ui-polish">` block (`ui-polish.css`).

1. One archive notice replaces the stacked dark bars (approved wording kept: ended + "not confirmed for a returning event").
2. Shorter hero (padding, h1 size, wave) so the notice and the category bar are in the first mobile viewport.
3. Sticky category bar (4 jumps, 4 equal columns on phones); `scroll-margin` keeps targets clear of it.

Tests: `node --test tests/*.test.cjs` 22/22; `ro-suite-nav.browser` 6,238 checks / 0 failures; `nav-alignment.browser` 40 checks; `first-run.browser` PASS (Chromium 1.55.1, local).
Test edits: archive checks target `.archive-notice` (AA contrast instead of exact bar colours); nav-alignment compares guide-grid geometry/DOM and no longer compares header chrome, which intentionally changed; inventory ignores the new style block and intro chrome.
Screenshots: `screenshots/before-*` / `after-*`.
