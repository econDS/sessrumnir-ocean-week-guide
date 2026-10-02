# RO Tools first-run consistency review

The four calculator heads are pinned in `suite-heads.json`; the guide uses the current PR head in CI. The local run in `suite-review-local.json` used exact remotely fetched commits, including guide `e988ea21c8ef66d876702a6e856006a03a6c04e9`. Later guide commits only add QA/report files; its production bytes are identical.

Actual cross-suite Chromium review at390px and1440px checks, for every candidate:
- primary start cue appears in first900px viewport
- critical assumptions remain outside closed disclosures
- correct current tool identity and aria-current
- all five launched children plus Portal navigation remain available; Best Status present
- Grade & Refine remains non-launchable
- Escape closes navigation and returns focus
- all three vendored nav1.3 files have identical approved SHA-256 across the five repositories

Individual PR tests additionally cover every required viewport, native progressive disclosure, exact before/after calculator outputs, storage/share/import-export and relevant original workflows. Cross-suite consistency is an explicit separate check, not inferred from their individual green statuses.

## Shared pattern
Leveling: three character inputs, then results; event details visible by results and optional buffs/archive/race settings remain accessible.
Reform: target, owned items, price refinement and spending/shopping results. Existing useful result-before-price layout retained; quickstart compacted and direct start/result links added.
Dim: current and target first, total/shopping next, optional Refine and market price details later. Default/user price dates and not-live warning remain visible; hover-to-price opens its native disclosure.
Best Status: activity first, relevant character/profile settings, one result or all comparison mode. Raw/community-model and Potion controversy warnings remain visible; view selection never changes stored values.
Ocean: archive notice, four utility jumps, copyable navigation and quest steps; full lore retained in a native disclosure.

No formula, default game/price data, nav release, tool ID, canonical URL or storage schema changed. No portal edits or merge/deploy performed. Real-device, WebKit/Firefox and post-merge Pages testing remain outside this evidence. No human usability score is claimed.
