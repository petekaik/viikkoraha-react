import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import SettingsPanel from '../components/SettingsPanel';
import { useAuthStore } from '../stores/authStore';
import { useSettingsStore } from '../stores/settingsStore';

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/', hash: '#/' }),
  HashRouter: ({ children }) => children,
  Routes: ({ children }) => children,
  Route: ({ element }) => element,
}));

// Mock hooks that reach out to Google APIs
vi.mock('../hooks/useGoogleAuth', () => ({
  useGoogleAuth: () => ({ logout: vi.fn() }),
  isGapiReady: () => true,
  onGapiReady: vi.fn(),
}));
vi.mock('../hooks/useGoogleSheets', () => ({
  useGoogleSheets: () => ({
    listSpreadsheets: vi.fn(),
    initSheets: vi.fn(),
    validateSpreadsheet: vi.fn(),
    createNewSpreadsheet: vi.fn(),
  }),
}));
vi.mock('../utils/settingsSync', () => ({
  saveSettingsToSheet: vi.fn(),
  ensureSettingsSheet: vi.fn(),
}));

describe('SettingsPanel profile section', () => {
  beforeEach(() => {
    useAuthStore.setState({
      isSignedIn: false,
      user: null,
      accessToken: null,
    });
    useSettingsStore.setState({
      clientId: '',
      apiKey: '',
      spreadsheetId: '',
    });
  });

  it('does not show profile when signed out', () => {
    render(<SettingsPanel />);
    expect(screen.queryByText('Kirjaudu ulos')).toBeFalsy();
  });

  it('shows profile with name and email when signed in', () => {
    useAuthStore.setState({
      isSignedIn: true,
      user: {
        name: 'Matti Meikäläinen',
        email: 'matti@example.com',
        imageUrl: 'https://example.com/photo.jpg',
      },
      accessToken: 'fake-token',
    });
    render(<SettingsPanel />);
    expect(screen.getByText('Matti Meikäläinen')).toBeInTheDocument();
    expect(screen.getByText('matti@example.com')).toBeInTheDocument();
    expect(screen.getByAltText('Matti Meikäläinen')).toBeInTheDocument();
  });

  it('shows user icon fallback when no imageUrl', () => {
    useAuthStore.setState({
      isSignedIn: true,
      user: {
        name: 'Matti',
        email: 'matti@example.com',
        imageUrl: '',
      },
      accessToken: 'fake-token',
    });
    render(<SettingsPanel />);
    expect(screen.getByText('Matti')).toBeInTheDocument();
    // Should show emoji fallback, not an img
    expect(screen.queryByRole('img')).toBeFalsy();
  });

  it('shows Käyttäjä fallback when user name is empty', () => {
    useAuthStore.setState({
      isSignedIn: true,
      user: { name: '', email: '', imageUrl: '' },
      accessToken: 'fake-token',
    });
    render(<SettingsPanel />);
    expect(screen.getByText('Käyttäjä')).toBeInTheDocument();
  });

  it('shows logout button when signed in', () => {
    useAuthStore.setState({
      isSignedIn: true,
      user: { name: 'Matti', email: '', imageUrl: '' },
      accessToken: 'fake-token',
    });
    render(<SettingsPanel />);
    expect(screen.getByText('🔓 Kirjaudu ulos')).toBeInTheDocument();
  });
});
