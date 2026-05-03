import '@testing-library/jest-dom';

/**
 * Ensure jsdom's localStorage is fully spec-compliant for Zustand's createJSONStorage.
 * jsdom provides localStorage but its implementation may differ from the real browser,
 * causing "storage.setItem is not a function" errors in tests.
 *
 * Rather than polyfilling (which conflicts with jsdom), we just verify it exists.
 * If tests still fail, the individual test files should mock the store directly.
 */
if (typeof localStorage === 'undefined') {
  // Fallback only if jsdom somehow doesn't provide localStorage at all
  const storage = {};
  globalThis.localStorage = {
    getItem: (key) => storage[key] ?? null,
    setItem: (key, value) => { storage[key] = String(value); },
    removeItem: (key) => { delete storage[key]; },
    clear: () => { for (const k of Object.keys(storage)) delete storage[k]; },
    get length() { return Object.keys(storage).length; },
    key: (index) => Object.keys(storage)[index] ?? null,
  };
}
