# Preview Assets — cinematic-dark

These files are shown to customers in the brand selector UI (Component 1).
Generate these after the compositions and print templates are finalized.

## Required Files

### thumbnail.jpg
- Dimensions: 800x450px
- Content: Single frame from player-intro-full.html showing full composition
- Export: JPEG, quality 85

### demo.mp4
- Dimensions: 1280x720px
- Duration: 6-8s loop
- Content: Compressed render of player-intro-full.html with sample data
- Format: H.264 MP4, web-optimized

### print-preview.jpg
- Dimensions: 600x800px
- Content: Poster layout with sample player data
- Export: JPEG, quality 85

## Generation Commands

```bash
# Render thumbnail from composition (single frame at 5s)
hyperframes screenshot \
  --composition compositions/player-intro-full.html \
  --data ../../../../tests/fixtures/orders/minimal-team.json \
  --frame 5 \
  --output preview/thumbnail.jpg \
  --width 800 --height 450

# Render demo loop
hyperframes render \
  --composition compositions/player-intro-full.html \
  --data ../../../../tests/fixtures/orders/minimal-team.json \
  --output preview/demo.mp4 \
  --width 1280 --height 720
```

## Status
- [ ] thumbnail.jpg
- [ ] demo.mp4
- [ ] print-preview.jpg
