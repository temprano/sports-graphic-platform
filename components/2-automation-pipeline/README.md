# Component 2 — Automation Pipeline

BullMQ worker process. Consumes jobs from Redis queue triggered by the
order state machine. Orchestrates ComfyUI (BiRefNet masking), Hyperframes
and Remotion (video rendering), and Photoshop UXP (print assets). Generates
watermarked proofs. Packages and delivers final assets.

## Start Here
See `/ARCHITECTURE.md` Component 2 section.
See `/docs/SECURITY.md` for consent gate requirements — these are mandatory
before any AI enhancement job runs.
See `/TODO.md` Component 2 section for current tasks.

## Critical Rules
- Consent gate checked before EVERY AI enhancement — no exceptions
- Finals never written to storage until order is PAID_IN_FULL
- Watermarks are baked pixel-level by FFmpeg/Sharp — never CSS overlays
- Failed jobs retry 3x then dead-letter — never silently drop

## Job Types
```
PROCESS_PHOTOS       ComfyUI BiRefNet on all player photos
RENDER_VIDEOS        Hyperframes/Remotion per player per format
RENDER_PRINTS        Photoshop UXP per player per print format
GENERATE_PROOFS      Watermarked versions of all outputs
PACKAGE_ORDER        Zip finals, generate delivery link
FULFILL_PRINT        Push to Prodigi/Printful API
GENERATE_PARENT_STORE Spin up parent store after team order delivered
```

## Local Dev
```bash
# Requires Redis on localhost:6379 and ComfyUI running
node src/queue/worker.js
```
