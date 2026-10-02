# Ocean navigation alignment 1.4.0

## Scope and immutable sources

- Exact latest guide baseline: `159a9d12ee1d1f2e6713297fcbd379952f1b69ab` on `master`, including the merged first-run utility links and archive status
- Shared navigation source: `econDS/ro_tools_portal` commit `24ca1068c8f6868b38d6224e661f818fec9897f9`
- New release directory: `docs/assets/ro-suite/1.4.0/`; all three files are copied without edits
- The 1.2.0 and 1.3.0 bundles, catalogs and lock files remain byte-identical for additive rollback

The only production document changes are one navigation-only style block and the module URL bump. Body padding remains 28px, or 16px at 720px and below. The 980px `.page` container, original CSS, guide scripts, original main DOM, commands, images, links, event dates, archive notices and first-run content remain unchanged.

The shared bar uses `--ro-suite-content-max-width: 980px` and `--ro-suite-inline-padding: 0px`. The internal `.bar` aligns with `.page`; the outer shared surface fills the existing body content width. The light-DOM Portal fallback is independently constrained to 980px, remains a 44px target, and needs no JavaScript. No body/header spacing compensation is introduced.

## Verification

- Actual untouched baseline browser capture completed before integration in the Portal alignment workflow: 42 suite samples and 35 PNG screenshots
- Untouched guide source suite: 12/12 passing
- Candidate source suite: 16/16 passing, including direct raw-candidate comparisons of guide DOM, original style and script bytes, clipboard data and ordered commands against the latest merged source
- `git diff --check`, Node syntax check for the added browser harness: passing
- Existing historical assertions retain their original hashes. The exact two reviewed replacements are reversed before first-run historical normalization; a separate new test checks the unnormalized candidate directly
- Local Chromium execution is unavailable in the current sandbox, so browser execution is recorded by the dedicated GitHub Actions workflow and must pass before review readiness is claimed

## Browser workflow

`.github/workflows/nav-alignment-qa.yml` runs only for the dedicated draft branch. It checks out the actual PR head and archives the exact latest 1.3.0 baseline. QA-only Playwright 1.55.1 is installed with Chromium. The existing exhaustive browser runner covers native and fallback copy behavior, all command controls, image/lightbox interactions, links, menu keyboard behavior, release HTTP bytes, storage and query/hash preservation, and console/network regressions. Its only visual expectation change is the neutral navbar separator, with the original colored identity now explicitly asserted on the visible icon.

The additional alignment runner covers 360, 390, 480, 720, 721, 768, 1036, 1037, 1440 and 1920px under both device schemes, in normal and blocked-module modes. It compares the actual original guide DOM and every measured original node rectangle relative to the main container. It checks `.bar` alignment, fixed-light theme, 44px controls, repeated toggles, Escape/focus return, no new overflow and unchanged query/hash. Screenshots and failure-safe reports are uploaded regardless of success.

## Rollback

Revert this rollout commit to restore the exact previous host integration and module reference. Existing immutable releases are retained. No merge or deployment is performed by this draft change.
