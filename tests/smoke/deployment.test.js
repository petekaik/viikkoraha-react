/**
 * Production deployment smoke tests.
 *
 * Validates that the deployed Viikkoraha app is alive, serves the expected
 * HTML shell, and exposes PWA assets correctly.
 *
 * Requires: DEPLOY_URL in .env (defaults to https://gitpages.morgeweb.com/viikkoraha)
 *
 * Run:  npm run test:smoke
 */

import { describe, it, expect } from 'vitest';

const BASE = process.env.DEPLOY_URL || 'https://gitpages.morgeweb.com/viikkoraha';

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
    expect(html).toContain('theme-color');
  });

  it('PWA manifest is reachable', async () => {
    const res = await fetch(`${BASE}/site.webmanifest`);
    expect(res.ok, `HTTP ${res.status}`).toBe(true);
    const json = await res.json();
    expect(json.name).toBe('Viikkoraha');
  });

  it('service worker is reachable', async () => {
    const res = await fetch(`${BASE}/sw.js`);
    expect(res.ok, `HTTP ${res.status}`).toBe(true);
    const sw = await res.text();
    expect(sw).toContain('viikkoraha');
  });

  it('static JS asset is served', async () => {
    // Find the hashed JS filename from index.html
    const res = await fetch(BASE);
    const html = await res.text();
    const match = html.match(/\/viikkoraha\/assets\/index-[^"]+\.js/);
    expect(match).not.toBeNull();
    const jsUrl = `https://gitpages.morgeweb.com${match[0]}`;
    const jsRes = await fetch(jsUrl);
    expect(jsRes.ok, `HTTP ${jsRes.status}`).toBe(true);
  });

  it('static CSS asset is served', async () => {
    const res = await fetch(BASE);
    const html = await res.text();
    const match = html.match(/\/viikkoraha\/assets\/index-[^"]+\.css/);
    expect(match).not.toBeNull();
    const cssUrl = `https://gitpages.morgeweb.com${match[0]}`;
    const cssRes = await fetch(cssUrl);
    expect(cssRes.ok, `HTTP ${cssRes.status}`).toBe(true);
  });
});
