import { describe, it, expect, vi } from 'vitest';
import { translations } from '../i18n/translations';

// Mock useTranslation — needed because some test files import stores that trigger it
vi.mock('../i18n/useTranslation', () => ({
  useTranslation: () => ({ t: (k) => k, language: 'fi', setLanguage: vi.fn() }),
}));

describe('translations', () => {
  it('has fi, se, en keys', () => {
    expect(Object.keys(translations).sort()).toEqual(['en', 'fi', 'se']);
  });

  it('fi translations exist for all common keys', () => {
    const fi = translations.fi;
    expect(fi.chores).toBeDefined();
    expect(fi.choreHeaders).toBeDefined();
    expect(fi.bookingHeaders).toBeDefined();
    expect(fi.sumHeaders).toBeDefined();
    expect(fi.userHeaders).toBeDefined();
    expect(fi.ui).toBeDefined();
    // Check that admin, dashboard, home etc. exist under ui
    expect(fi.ui.admin).toBeDefined();
    expect(fi.ui.dashboard).toBeDefined();
    expect(fi.ui.home).toBeDefined();
    expect(fi.ui.settings).toBeDefined();
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
