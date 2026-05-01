import { describe, it, expect } from 'vitest';
import { validateSpreadsheetId, validateClientId, validateApiKey } from '../utils/validation';

describe('validateSpreadsheetId', () => {
  it('accepts valid bare ID', () => {
    expect(validateSpreadsheetId('abc123def456ghijklmno').valid).toBe(true);
  });

  it('accepts full URL', () => {
    expect(
      validateSpreadsheetId('https://docs.google.com/spreadsheets/d/abc123def456ghijklmno/edit#gid=0').valid,
    ).toBe(true);
  });

  it('rejects too short ID', () => {
    expect(validateSpreadsheetId('short').valid).toBe(false);
  });

  it('rejects empty string', () => {
    expect(validateSpreadsheetId('').valid).toBe(false);
  });
});

describe('validateClientId', () => {
  it('accepts apps.googleusercontent.com suffix', () => {
    expect(
      validateClientId('123-abc.apps.googleusercontent.com').valid,
    ).toBe(true);
  });

  it('accepts alphanumeric with dots and dashes', () => {
    expect(validateClientId('test-client-123.apps.googleusercontent.com').valid).toBe(true);
  });

  it('rejects empty', () => {
    expect(validateClientId('').valid).toBe(false);
  });
});

describe('validateApiKey', () => {
  it('accepts long enough key', () => {
    expect(validateApiKey('AIzaSyABCDEFGHIJKLMNOPQRSTUVWXYZ').valid).toBe(true);
  });

  it('rejects short key', () => {
    expect(validateApiKey('AIzaSyShort').valid).toBe(false);
  });

  it('rejects empty', () => {
    expect(validateApiKey('').valid).toBe(false);
  });
});
