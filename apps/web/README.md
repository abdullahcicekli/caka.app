# @caka/web

Caka'nın tek Cloudflare Worker uygulaması: Hono (`/api/*`, `/i/*`) + React
Router v8 SSR aynı Worker'da. Kurulum, komutlar ve katkı rehberi için kök
[`README.md`](../../README.md); ajan kuralları için [`AGENTS.md`](../../AGENTS.md).

```bash
pnpm dev                      # kökten; lokal D1/R2 ile dev sunucusu
pnpm typecheck && pnpm test   # PR öncesi asgari kontrol
pnpm deploy                   # build + wrangler deploy
```
