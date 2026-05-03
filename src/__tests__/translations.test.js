import { describe, it, expect, beforeEach } from 'vitest';
import { useLanguageStore } from '../stores/languageStore';
import { translations } from '../i18n/translations';

describe('translations', () => {
  beforeEach(() => {
    useLanguageStore.setState({ language: 'fi' });
  });

  it('has fi, se, en keys', () => {
    expect(Object.keys(translations).sort()).toEqual(['en', 'fi', 'se']);
  });

  it('fi translations exist for all common keys', () => {
    const fi = translations.fi;
    expect(fi.chores).toBeDefined();
    expect(fi.bookings).toBeDefined();
    expect(fi.sums).toBeDefined();
    expect(fi.users).toBeDefined();
    expect(fi.settings).toBeDefined();
    expect(fi.choreHeaders).toBeDefined();
    expect(fi.bookingHeaders).toBeDefined();
    expect(fi.sumHeaders).toBeDefined();
    expect(fi.userHeaders).toBeDefined();
  });

  it('se and en have same keys as fi', () => {
    const fiKeys = Object.keys(translations.fi).sort();
    expect(Object.keys(translations.se).sort()).toEqual(fiKeys);
    expect(Object.keys(translations.en).sort()).toEqual(fiKeys);
  });

  it('chores translations have expected structure', () => {
    const fiChores = translations.fi.chores;
    expect(fiChores.siivous).toBeDefined();
    expect(fiChores.tiskaus).toBeDefined();
    expect(fiChores.ruoanlaitto).toBeDefined();
    expect(fiChores.pyykki).toBeDefined();
    expect(fiChores.roskat).toBeDefined();
    expect(fiChores.ruokaostokset).toBeDefined();
    expect(fiChores.posti).toBeDefined();
    expect(fiChores.vauva).toBeDefined();
  });
});
