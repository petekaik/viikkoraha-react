import { describe, it, expect } from 'vitest';
import { parseFinnishNumber } from '../utils/parseNumber';

describe('parseFinnishNumber', () => {
  it('parses integer string', () => {
    expect(parseFinnishNumber('42')).toBe(42);
  });

  it('parses decimal with comma (Finnish locale)', () => {
    expect(parseFinnishNumber('0,5')).toBe(0.5);
    expect(parseFinnishNumber('1,5')).toBe(1.5);
    expect(parseFinnishNumber('42,75')).toBe(42.75);
  });

  it('parses decimal with dot (English locale)', () => {
    expect(parseFinnishNumber('0.5')).toBe(0.5);
    expect(parseFinnishNumber('12.34')).toBe(12.34);
  });

  it('handles whitespace', () => {
    expect(parseFinnishNumber('  3,5  ')).toBe(3.5);
  });

  it('returns 0 for empty/undefined/null', () => {
    expect(parseFinnishNumber('')).toBe(0);
    expect(parseFinnishNumber(null)).toBe(0);
    expect(parseFinnishNumber(undefined)).toBe(0);
  });

  it('returns raw number as-is', () => {
    expect(parseFinnishNumber(3.5)).toBe(3.5);
    expect(parseFinnishNumber(0)).toBe(0);
  });

  it('handles negative numbers', () => {
    expect(parseFinnishNumber('-5,5')).toBe(-5.5);
    expect(parseFinnishNumber('-10.25')).toBe(-10.25);
  });

  it('returns 0 for non-numeric strings', () => {
    expect(parseFinnishNumber('abc')).toBe(0);
    expect(parseFinnishNumber('N/A')).toBe(0);
  });
});
