# Pixel Perfect Replication

Implement exactly the screenshot and nothing else

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b0e5f01e-2e44-4f81-a9bf-0a89b9ecae63).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Architecture

Plain **Vite + React** single-page app with **React Router** for client-side routing.
There is no server-side rendering and no Cloudflare/Wrangler config.

| Path | Page |
| --- | --- |
| `/` | Landing page |
| `/signin` (alias `/sign-in`) | Sign in |
| `/signup` (alias `/sign-up`) | Sign up |
| `/app` | Dashboard (requires sign-in, redirects to `/signin` otherwise) |

- Routes are defined in `src/router.tsx`; pages live in `src/pages/`.
- Auth is Supabase email + password, fully client-side (`src/integrations/supabase/client.ts`).

## Build & deploy (Vercel)

```sh
npm run build   # vite build → dist/
npm run preview # serve dist/ locally
```

`vercel.json` sets the Vite framework preset, `dist/` as the output directory,
and a SPA fallback rewrite so deep links like `/app` are resolved client-side.

Required build-time env vars (already in `.env`): `VITE_SUPABASE_URL`,
`VITE_SUPABASE_PUBLISHABLE_KEY`.

