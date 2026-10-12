import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const file = resolve(process.cwd(), 'dist-web/index.html');
if (!existsSync(file)) throw new Error('Expo did not produce dist-web/index.html');
let html = readFileSync(file, 'utf8');
// Expo generates its own HTML during export, so changes to public/index.html
// alone are not sufficient for predictable production metadata.
html = html
  .replace(/<meta\b[^>]*\b(?:name|property)=["'](?:description|robots|og:[^"']*|twitter:[^"']*)["'][^>]*\/?>/gi, '')
  .replace(/<link\b[^>]*\brel=["'](?:canonical|icon|apple-touch-icon|manifest)["'][^>]*\/?>/gi, '')
  .replace(/<title>[\s\S]*?<\/title>/i, '');
const tags = `
  <title>XUM AI App | Contribute to Better AI</title>
  <meta name="description" content="XUM AI contributor app for voice, image, video and language data tasks, validation and rewards." />
  <meta name="robots" content="noindex,nofollow,noarchive,nosnippet" />
  <meta name="theme-color" content="#101522" />
  <link rel="canonical" href="https://app.xumai.app/" />
  <link rel="icon" type="image/png" href="/favicon.png" />
  <link rel="apple-touch-icon" href="/icon.png" />
  <link rel="manifest" href="/manifest.webmanifest" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="XUM AI" />
  <meta property="og:title" content="XUM AI App | Contribute to Better AI" />
  <meta property="og:description" content="Contribute voice, image, video and language data for better AI." />
  <meta property="og:url" content="https://app.xumai.app/" />
  <meta property="og:image" content="https://xumai.app/og-image.svg" />
  <meta property="og:image:alt" content="XUM AI — Human intelligence. Better AI." />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="XUM AI App | Contribute to Better AI" />
  <meta name="twitter:description" content="Contribute to AI data tasks and validation with XUM AI." />
  <meta name="twitter:image" content="https://xumai.app/og-image.svg" />
`;
if (!html.includes('</head>')) throw new Error('Expo export missing </head>');
html = html.replace('</head>', tags + '</head>');
writeFileSync(file, html);
console.log('Applied XUM AI web production metadata.');
