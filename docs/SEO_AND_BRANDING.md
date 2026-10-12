# XUM AI SEO and brand surfaces

## Public website (xum-portal)
The public site at https://xumai.app uses route metadata from src/seo/routes.json. Its Vite build runs scripts/prerender-seo.mjs to emit index.html for each public route; the SPA also updates metadata during navigation. Public robots.txt and sitemap.xml are hosted at the root.

## Contributor app (xumai/xum_ai_app)
This web app is private and uses `noindex,nofollow`. The canonical Expo/Metro build runs scripts/post-export-seo.mjs after `expo export` to patch the actual dist-web/index.html. Browser screen titles update when navigating. The existing app favicon.png and icon.png are retained from the app's brand assets.

## Admin panel
The administrative app must remain noindex, with robots.txt disallowing crawling. Server-side authorization, session policies, RLS and MFA must be implemented independently of metadata.

## Social assets
Shared public OG artwork is served by https://xumai.app/og-image.svg. Consider publishing a 1200x630 JPG/PNG as the public social preview because many social crawlers do not support SVG.
