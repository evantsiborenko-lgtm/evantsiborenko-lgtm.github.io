KVSvideo /marketplace/ media

Target files for Showcase Player:
- pen-before-after.webp — 1638x2048, lossless WebP, native resolution
- pen-product.webp — 1643x2047, lossless WebP, native resolution
- pen-gift.webp — 1643x2047, lossless WebP, native resolution
- pen-executive.webp — 1643x2047, lossless WebP, native resolution
- pen-signature-poster.webp — 992x1216, lossless WebP
- pen-signature.webm — 992x1216, 24 fps, VP9 quality-first native-resolution transcode, Opus audio
- pen-signature-original.mp4 — untouched source MP4 for visual/control comparison and fallback

Note: H.264 from the source MP4 cannot be remuxed into a browser-compatible WebM without transcoding. An exact lossless VP9 test produced about 69 MB for 10 seconds, so it is intentionally not used for the mobile trial. The selected WebM keeps the original geometry and frame rate without resizing.
