# Sessrumnir Ocean Week Event

Static GitHub Pages page for Ocean Week navigation commands.

Publish GitHub Pages from the `docs/` folder.

## Structure

- `docs/index.html` - main event navigation page
- `docs/assets/event-warp-npc.png` - NPC image used in the warp city cards

## Fast Asset Flow

Capture or copy an image, then save it straight into `docs/assets`. This also works if you copy an image file, and falls back to the newest Windows screenshot:

```powershell
powershell -STA -ExecutionPolicy Bypass -File .\scripts\save-clipboard-image.ps1 event-warp-npc
```

Or import the newest image from the Windows screenshot folder:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\import-latest-screenshot.ps1 event-warp-npc
```

## Deploy

Enable GitHub Pages for this repository and publish from the `docs/` folder.
