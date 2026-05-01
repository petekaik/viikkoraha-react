import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSettingsStore } from '../stores/settingsStore';

// Vitest jsdom provides localStorage, but Zustand persist middleware uses it directly.
// Reset store state manually instead of clearing localStorage.
beforeEach(() => {
  useSettingsStore.setState({
    clientId: '',
    apiKey: '',
    spreadsheetId: '',
  });
  // Also clear persisted data
  try {
    localStorage.removeItem('viikkoraha-settings');
  } catch { /* ignore */ }
});

describe('settingsStore', () => {
  it('initial state is empty', () => {
    const s = useSettingsStore.getState();
    expect(s.clientId).toBe('');
    expect(s.apiKey).toBe('');
    expect(s.spreadsheetId).toBe('');
  });

  it('setClientId updates value', () => {
    useSettingsStore.getState().setClientId('test-client.apps.googleusercontent.com');
    expect(useSettingsStore.getState().clientId).toBe('test-client.apps.googleusercontent.com');
  });

  it('setApiKey updates value', () => {
    useSettingsStore.getState().setApiKey('AIzaSyTestKey');
    expect(useSettingsStore.getState().apiKey).toBe('AIzaSyTestKey');
  });

  it('setSpreadsheetId updates value', () => {
    useSettingsStore.getState().setSpreadsheetId('abc123def456ghijklmno');
    expect(useSettingsStore.getState().spreadsheetId).toBe('abc123def456ghijklmno');
  });

  it('setAllFromObject updates multiple fields', () => {
    useSettingsStore.getState().setAllFromObject({
      clientId: 'c',
      apiKey: 'a',
      spreadsheetId: 's',
    });
    const s = useSettingsStore.getState();
    expect(s.clientId).toBe('c');
    expect(s.apiKey).toBe('a');
    expect(s.spreadsheetId).toBe('s');
  });

  it('clear resets all fields', () => {
    useSettingsStore.getState().setAllFromObject({
      clientId: 'c', apiKey: 'a', spreadsheetId: 's',
    });
    useSettingsStore.getState().clear();
    const s = useSettingsStore.getState();
    expect(s.clientId).toBe('');
    expect(s.apiKey).toBe('');
    expect(s.spreadsheetId).toBe('');
  });
});
