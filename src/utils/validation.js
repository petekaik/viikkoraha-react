/**
 * Validate a Google Sheets spreadsheet ID.
 * Accepts a full URL (https://docs.google.com/spreadsheets/d/<ID>/...) or just the bare ID.
 */
export function validateSpreadsheetId(id) {
  if (!id || typeof id !== 'string') {
    return { valid: false, error: 'Spreadsheet ID is required' };
  }

  const trimmed = id.trim();

  // Extract from URL: /d/<ID>/
  const urlMatch = trimmed.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (urlMatch) {
    const extracted = urlMatch[1];
    if (/^[a-zA-Z0-9-_]{20,}$/.test(extracted)) {
      return { valid: true, error: '', extracted };
    }
    return { valid: false, error: 'Invalid spreadsheet ID found in URL' };
  }

  // Bare ID
  if (/^[a-zA-Z0-9-_]{20,}$/.test(trimmed)) {
    return { valid: true, error: '', extracted: trimmed };
  }

  return {
    valid: false,
    error:
      'Invalid spreadsheet ID. Expected a Google Sheets URL or a 20+ character alphanumeric ID.',
  };
}

/**
 * Validate a Google OAuth client ID.
 * Must end with .apps.googleusercontent.com or match typical client ID format.
 */
export function validateClientId(id) {
  if (!id || typeof id !== 'string') {
    return { valid: false, error: 'Client ID is required' };
  }

  const trimmed = id.trim();

  if (trimmed.endsWith('.apps.googleusercontent.com')) {
    return { valid: true, error: '' };
  }

  if (/^[a-zA-Z0-9-_.]+\.apps\.googleusercontent\.com$/.test(trimmed)) {
    return { valid: true, error: '' };
  }

  // Fallback: general alphanumeric with dots/dashes
  if (/^[a-zA-Z0-9-_.]{20,}$/.test(trimmed)) {
    return { valid: true, error: '' };
  }

  return {
    valid: false,
    error:
      'Invalid Client ID. Should end with .apps.googleusercontent.com or be a valid Google OAuth client ID.',
  };
}

/**
 * Validate a Google API key.
 * Typically starts with 'AIza' and is at least 20 characters.
 */
export function validateApiKey(key) {
  if (!key || typeof key !== 'string') {
    return { valid: false, error: 'API Key is required' };
  }

  const trimmed = key.trim();

  if (trimmed.length < 20) {
    return {
      valid: false,
      error: 'API Key must be at least 20 characters long',
    };
  }

  if (!trimmed.startsWith('AIza')) {
    return {
      valid: false,
      error: 'API Key should start with "AIza". Please check your key.',
    };
  }

  return { valid: true, error: '' };
}
