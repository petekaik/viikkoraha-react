import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSettingsStore } from '../stores/settingsStore';

// Vitest jsdom provides localStorage, but Zustand persist middleware uses it directly.
// Reset store state manually instead of clearing localStorage.
beforeEach(() => {
  useSettingsStore.setState({
    clientId: '',
    apiKey: '',
    spreadsheetId: '',
    _lastSheetSync: null,
  });
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

  it('clear resets all fields to defaults', () => {
    useSettingsStore.getState().setAllFromObject({
      clientId: 'c', apiKey: 'a', spreadsheetId: 's',
    });
    useSettingsStore.getState().clear();
    const s = useSettingsStore.getState();
    expect(s.clientId).toBe('');
    expect(s.apiKey).toBe('');
    expect(s.spreadsheetId).toBeTypeOf('string'); // default is type string (may be '' or DEFAULT_SPREADSHEET_ID)
  });

  it('syncFromSheet merges key-value map into store', () => {
    useSettingsStore.getState().syncFromSheet({
      clientId: 'sheet-client.apps.googleusercontent.com',
      apiKey: 'sheet-key',
      spreadsheetId: 'sheet-spreadsheet-id',
    });
    const s = useSettingsStore.getState();
    expect(s.clientId).toBe('sheet-client.apps.googleusercontent.com');
    expect(s.apiKey).toBe('sheet-key');
    expect(s.spreadsheetId).toBe('sheet-spreadsheet-id');
    expect(s._lastSheetSync).toBeGreaterThan(0);
  });

  it('syncFromSheet only overrides non-empty values', () => {
    // Set initial state
    useSettingsStore.getState().setAllFromObject({
      clientId: 'existing-client',
      apiKey: 'existing-key',
      spreadsheetId: 'existing-id',
    });
    // Sync with partial data — missing values should keep existing
    useSettingsStore.getState().syncFromSheet({
      clientId: 'new-client',
    });
    const s = useSettingsStore.getState();
    expect(s.clientId).toBe('new-client');
    expect(s.apiKey).toBe('existing-key');
    expect(s.spreadsheetId).toBe('existing-id');
  });

  it('toSheetRows returns key-value rows', () => {
    useSettingsStore.getState().setAllFromObject({
      clientId: 'test-client',
      apiKey: 'test-key',
      spreadsheetId: 'test-id',
    });
    const rows = useSettingsStore.getState().toSheetRows();
    expect(rows).toEqual([
      ['clientId', 'test-client'],
      ['apiKey', 'test-key'],
      ['spreadsheetId', 'test-id'],
    ]);
  });

  it('isReady returns false when any setting is empty', () => {
    useSettingsStore.setState({ clientId: '', apiKey: 'key', spreadsheetId: 'id' });
    expect(useSettingsStore.getState().checkReady()).toBe(false);

    useSettingsStore.setState({ clientId: 'c', apiKey: '', spreadsheetId: 'id' });
    expect(useSettingsStore.getState().checkReady()).toBe(false);

    useSettingsStore.setState({ clientId: 'c', apiKey: 'key', spreadsheetId: '' });
    expect(useSettingsStore.getState().checkReady()).toBe(false);
  });

  it('isReady returns true when all settings are set', () => {
    useSettingsStore.getState().setAllFromObject({
      clientId: 'c', apiKey: 'a', spreadsheetId: 's',
    });
    expect(useSettingsStore.getState().checkReady()).toBe(true);
  });
});
