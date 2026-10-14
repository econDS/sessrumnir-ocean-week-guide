# Dynamic navigation 2.0.0

Ocean Week keeps the `master` / `docs` publishing source and `ocean-week-guide` stable ID. The only application change is the local module URL: `assets/ro-suite/2.0.0/nav.js`. No guide content, commands, storage, theme tokens, or inline scripts change.

The component displays frozen bundled metadata immediately and automatically fetches `https://econds.github.io/ro_tools_portal/catalog/v1/tools.json` on connection. The endpoint requires no consumer attribute. Catalog changes (including new tools absent from the bundle, rename, removal and ordering) take effect on a later page load without rebuilding this application. Requests revalidate the catalog; offline, timeout or invalid data retain the installed fallback. Script failure retains the light-DOM Portal link.

The shared v2 contract keeps schemaVersion 1, caps responses at 256 KiB and 500 tools, times out after 1.5 seconds, and accepts only raw HTTPS URLs on `econds.github.io` with one repository-root path. Credentials, ports, query strings, fragments, escapes and dot segments are rejected. Catalog text uses safe DOM APIs; no remote executable code loads. Search and a scrollable list keep large catalogs compact.

## Verification

- `node --test tests/*.test.cjs`: historical application invariants plus raw candidate module path, exact approved page delta, integrity hashes and every historical public asset.
- `NODE_PATH=<pinned Playwright 1.55.1 modules> BASE_DOCS=<baseline docs> node tests/ro-suite-nav.browser.cjs`: exhaustive guide interaction, clipboard, storage, light/dark OS, mobile/desktop, navigation keyboard and script-failure comparisons against commit `e76cd86cd2812402394b22e121310b43dafa8985`. The exact catalog endpoint is mocked before navigation, and no other new external request is accepted.
- `NODE_PATH=<pinned Playwright modules> node tests/dynamic-nav.browser.cjs`: unchanged installed bundle with a 120-new-tool remote response, current rename, search, offline, timeout, invalid schema and script failure at 390/1440 widths.
- `.github/workflows/dynamic-nav-qa.yml` runs these checks for the dedicated feature branch without touching historical workflow gates.

Historical test inputs reverse only the exact approved 2.0.0 → 1.5.1 module path. Independent raw-candidate tests verify that this normalization cannot hide any application change or broken module path.

## Migration and rollback

Publish the Portal catalog and reviewed v2 release first, then roll out child PRs independently after approval. Until that happens, the bundled fallback remains usable. Merge and deployment are not performed by this change.

Rollback by restoring the module path to `./assets/ro-suite/1.5.1/nav.js`. Historical release directories remain byte-identical. Roll back registry metadata in the Portal for catalog-only issues; no child redeployment is needed for a valid catalog correction.

Local verification: 24/24 static tests and all 10 dynamic browser scenarios passed using Playwright 1.55.1 and system Chromium. Remote scenarios also resolve an unknown current ID and observe removal/reordering on refresh using the same checked-in bundle. The focused exhaustive browser comparison (`QA_WIDTHS=390 QA_THEMES=light`) passed all 827 checks, including all guide controls, local storage and URL preservation, keyboard navigation, script-failure fallback and real native clipboard tests at mobile/light and desktop/dark. The default CI runner retains the complete four-width/two-theme matrix. A pre-existing popup timing race was fixed by awaiting the exact expected destination before asserting its URL and noopener behavior; no destination guard was removed.
