/**
 * Production + preview deployment smoke tests.
 *
 * Validates that the deployed Viikkoraha app serves index.html,
 * PWA assets, JS/CSS bundles.
 *
 * Requires: DEPLOY_URL in environment
 *   Dev:  http://localhost:4173/viikkoraha   (npm run test:dev-smoke, preview)
 *   UAT:  https://gitpages.morgeweb.com/viikkoraha  (npm run test:smoke)
 */

import { describe, it, expect } from 'vitest';

const raw = process.env.DEPLOY_URL || 'https://gitpages.morgeweb.com/viikkoraha';
const BASE = raw.endsWith('/') ? raw : raw + '/';

describe('Deployment smoke', () => {
  it('serves index.html with correct content-type', async () => {
    const res = await fetch(BASE);
    expect(res.ok, `HTTP ${res.status}`).toBe(true);
    const ct = res.headers.get('content-type') || '';
    expect(ct).toContain('text/html');
  });

  it('index.html contains Viikkoraha title', async () => {
    const res = await fetch(BASE);
    const html = await res.text();
    expect(html).toContain('<title>Viikkoraha</title>');
  });

  it('index.html has PWA meta tags', async () => {
    const res = await fetch(BASE);
    const html = await res.text();
    expect(html).toContain('apple-mobile-web-app-capable');
    expect(html).toContain('mobile-web-app-capable');
    expect(html).toContain('theme-color');
  });

  it('PWA manifest is reachable', async () => {
    const res = await fetch(BASE + 'site.webmanifest');
    expect(res.ok, `HTTP ${res.status}`).toBe(true);
  });

  it('service worker is reachable', async () => {
    const res = await fetch(BASE + 'sw.js');
    expect(res.ok, `HTTP ${res.status}`).toBe(true);
    const sw = await res.text();
    expect(sw).toContain('viikkoraha');
  });

  it('static JS asset is served', async () => {
    const htmlRes = await fetch(BASE);
    const html = await htmlRes.text();
    const match = html.match(/(?:\/viikkoraha)?\/assets\/index-[^"]+\.js/);
    expect(match, 'JS asset not found in HTML').not.toBeNull();
    const jsUrl = new URL(match[0], BASE).toString();
    const res = await fetch(jsUrl);
    expect(res.ok, `HTTP ${res.status} for ${jsUrl}`).toBe(true);
  });

  it('static CSS asset is served', async () => {
    const htmlRes = await fetch(BASE);
    const html = await htmlRes.text();
    const match = html.match(/(?:\/viikkoraha)?\/assets\/index-[^"]+\.css/);
    expect(match, 'CSS asset not found in HTML').not.toBeNull();
    const cssUrl = new URL(match[0], BASE).toString();
    const res = await fetch(cssUrl);
    expect(res.ok, `HTTP ${res.status} for ${cssUrl}`).toBe(true);
  });

  it('PWA manifest has correct values', async () => {
    const res = await fetch(BASE + 'site.webmanifest');
    const json = await res.json();
    expect(json.name).toBe('Viikkoraha');
    expect(json.display).toBe('standalone');
  });
});
