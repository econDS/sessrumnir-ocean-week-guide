# Ocean navigation theme rollout

- Base: `7d0862765923d6b7df9ec60a16132fc375af9ba0` (`master`, publishing source remains `docs/`).
- Additive shared release: `1.5.1`, source `44b090748afc1dbf13eb5d4b78d2a0102d9d9e9c`.
- The eight supported theme properties bind to the existing ocean palette and Sarabun body font. Accent and focus use the readable `--accent-dark`. The static Portal fallback shares those bindings.
- Existing alignment max width/gutters, closed 53px component height, 44px targets, theme=light, archive warning, guide copy, first-run links, lore disclosure, clipboard code and all historical artifacts remain unchanged.
- Before edits: 16 static tests passed after materializing the exact historical commit needed by the existing alignment test.
- Candidate: 19 static tests passed. New tests reconstruct every production byte of current master after removing only the exact approved theme delta and verify immutable artifacts.
- Local browser attempt used pinned Playwright 1.55.1 and installed Chromium but could not launch because the environment denies socket creation (`Operation not permitted`). No browser pass is claimed from that attempt.
- `nav-theme-qa.yml` runs the existing comprehensive clipboard, copy-control, image, archive, navigation, fallback and native clipboard browser coverage against current master, plus ten-width/two-device-theme geometry checks and failure-safe evidence artifacts. The new workflow is restricted to this draft feature branch and has read-only repository permissions.
- Historical tests retain their exact baselines through a strict reversible theme normalizer. Only the intentional semantic colors/icon treatment and active module path changed in existing browser expectations.
