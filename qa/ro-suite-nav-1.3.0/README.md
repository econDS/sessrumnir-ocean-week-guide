# Navigation 1.3.0 rollout QA

Base and pre-edit test output are in baseline.json and baseline-tests.log. The only production HTML change is the local module path 1.2.0 → 1.3.0. All 1.2.0 artifacts remain for rollback. Historical 1.2.0 screenshots are unchanged historical evidence, not new 1.3.0 evidence. New reports and screenshots are uploaded by the read-only PR workflow against its exact head. Existing full calculator/guide regression compares original immutable application content, and the new source invariant additionally compares the immediately previous main/master page byte-for-byte after reversing just the module path. No business code or data changes.

Source: econDS/ro_tools_portal at e497e33ca172a62fce5432c735c91c7b75d1a52c; release source commit 4e8a56397e64b41cfb05c86a4df811ddc10e8003. Checksums are enforced in tests/nav130-rollout.test.cjs and vendor nav.lock.json.

Commands: node --test tests/*.test.cjs; real browser runner in .github/workflows/ro-suite-nav-qa.yml. CI results and final cross-repository report will be linked in the Draft PR.

Rollback: change only the module path back to ./assets/ro-suite/1.2.0/nav.js; no data or schema migration. Real mobile hardware, WebKit/Firefox and post-merge Pages are not tested in this draft.
