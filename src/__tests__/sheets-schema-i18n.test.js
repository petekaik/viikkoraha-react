import { describe, it, expect } from 'vitest';
import { getDefaultChores, getChoreHeaders } from '../utils/sheets-schema';

describe('sheets-schema i18n', () => {
  it('getDefaultChores returns chores in finnish by default', () => {
    const chores = getDefaultChores();
    expect(chores[0].description).toBe('Siivous');
    expect(chores[0].displayName).toBe('Siivous');
    expect(chores[0].id).toBe('siivous');
    expect(chores[0].value).toBe(2);
  });

  it('getDefaultChores returns 8 chores', () => {
    expect(getDefaultChores().length).toBe(8);
    expect(getDefaultChores('en').length).toBe(8);
    expect(getDefaultChores('se').length).toBe(8);
  });

  it('getDefaultChores returns english translations', () => {
    const chores = getDefaultChores('en');
    const cleaning = chores.find((c) => c.id === 'siivous');
    expect(cleaning.description).toBe('Cleaning');
    expect(cleaning.displayName).toBe('Cleaning');
  });

  it('getDefaultChores returns swedish translations', () => {
    const chores = getDefaultChores('se');
    const cleaning = chores.find((c) => c.id === 'siivous');
    expect(cleaning.displayName).toBe('Städning');
  });

  it('getDefaultChores falls back to fi for unknown language', () => {
    const chores = getDefaultChores('de');
    expect(chores[0].description).toBe('Siivous');
  });

  it('getChoreHeaders returns finnish headers by default', () => {
    expect(getChoreHeaders()).toEqual(['ID', 'Kuvaus', 'Arvo', 'Näyttönimi']);
  });

  it('getChoreHeaders returns english headers', () => {
    expect(getChoreHeaders('en')).toEqual(['ID', 'Description', 'Value', 'Display Name']);
  });

  it('getChoreHeaders returns swedish headers', () => {
    expect(getChoreHeaders('se')).toEqual(['ID', 'Beskrivning', 'Värde', 'Visningsnamn']);
  });
});
