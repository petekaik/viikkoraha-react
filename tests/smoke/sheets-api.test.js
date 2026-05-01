/**
 * Google Sheets API integration tests.
 *
 * Validates that the configured API key + spreadsheet + client ID
 * actually work against the live Google APIs.
 *
 * Requires in .env:
 *   VITE_GOOGLE_CLIENT_ID  — OAuth 2.0 Client ID
 *   VITE_GOOGLE_API_KEY    — Google API Key (Sheets API enabled)
 *   VITE_SPREADSHEET_ID    — Test spreadsheet ID
 *
 * Run:  npm run test:smoke
 */

import { describe, it, expect } from 'vitest';

const CLIENT_ID = process.env.VITE_GOOGLE_CLIENT_ID || '';
const API_KEY = process.env.VITE_GOOGLE_API_KEY || '';
const SPREADSHEET_ID = process.env.VITE_SPREADSHEET_ID || '';

const runApiTests = !!(CLIENT_ID && API_KEY && SPREADSHEET_ID);

describe('Google Sheets API', () => {
  it('has credentials configured in .env', () => {
    if (!runApiTests) {
      console.warn(
        'ℹ️  Skipping Google Sheets API tests — set VITE_GOOGLE_CLIENT_ID, VITE_GOOGLE_API_KEY, and VITE_SPREADSHEET_ID in .env',
      );
      // Don't fail — just log. CI without .env should still pass.
      expect(true).toBe(true);
      return;
    }
    expect(API_KEY).toBeTruthy();
    expect(CLIENT_ID).toBeTruthy();
    expect(SPREADSHEET_ID).toBeTruthy();
  });

  it('API key can access Chores sheet', { skip: !runApiTests }, async () => {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Chores!A2:D?key=${API_KEY}`;
    const res = await fetch(url);

    if (res.status === 403) {
      console.warn('API key works but lacks Sheets access — check Google Cloud Console restrictions');
    }
    expect(res.ok, `HTTP ${res.status}: ${await res.text().then(t => t.slice(0, 200))}`).toBe(true);

    const data = await res.json();
    expect(Array.isArray(data.values)).toBe(true);
    expect(data.values.length).toBeGreaterThan(0);
  });

  it('API key can access Bookings sheet', { skip: !runApiTests }, async () => {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Bookings!A2:G?key=${API_KEY}`;
    const res = await fetch(url);
    expect(res.ok, `HTTP ${res.status}`).toBe(true);
  });

  it('API key can access Sums sheet', { skip: !runApiTests }, async () => {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Sums!A2:B?key=${API_KEY}`;
    const res = await fetch(url);
    expect(res.ok, `HTTP ${res.status}`).toBe(true);
  });

  it('spreadsheet metadata is accessible', { skip: !runApiTests }, async () => {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}?key=${API_KEY}`;
    const res = await fetch(url);
    expect(res.ok, `HTTP ${res.status}`).toBe(true);
    const meta = await res.json();
    expect(meta.properties.title).toBeTruthy();
    const sheetTitles = (meta.sheets || []).map(s => s.properties.title.toLowerCase());
    expect(sheetTitles).toContain('chores');
    expect(sheetTitles).toContain('bookings');
    expect(sheetTitles).toContain('sums');
  });
});
