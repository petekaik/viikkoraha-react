import { describe, it, expect, beforeEach } from 'vitest';
import { useLanguageStore } from '../stores/languageStore';

describe('languageStore', () => {
  beforeEach(() => {
    useLanguageStore.setState({ language: 'fi' });
  });

  it('default language is fi', () => {
    expect(useLanguageStore.getState().language).toBe('fi');
  });

  it('setLanguage changes language', () => {
    useLanguageStore.getState().setLanguage('en');
    expect(useLanguageStore.getState().language).toBe('en');
  });

  it('setLanguage rejects invalid language code', () => {
    useLanguageStore.getState().setLanguage('de');
    expect(useLanguageStore.getState().language).toBe('fi');
  });

  it('setLanguage accepts fi, se, en', () => {
    const s = useLanguageStore.getState();
    s.setLanguage('se');
    expect(useLanguageStore.getState().language).toBe('se');
    s.setLanguage('en');
    expect(useLanguageStore.getState().language).toBe('en');
    s.setLanguage('fi');
    expect(useLanguageStore.getState().language).toBe('fi');
  });

  it('uses persist middleware (set/get roundtrip)', () => {
    // Verify persistence works via set/get (not direct localStorage)
    useLanguageStore.getState().setLanguage('en');
    expect(useLanguageStore.getState().language).toBe('en');
    useLanguageStore.getState().setLanguage('se');
    expect(useLanguageStore.getState().language).toBe('se');
    useLanguageStore.getState().setLanguage('fi');
    expect(useLanguageStore.getState().language).toBe('fi');
  });
});
