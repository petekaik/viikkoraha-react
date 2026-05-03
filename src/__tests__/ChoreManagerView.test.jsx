import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChoreManagerView from '../views/ChoreManagerView';
import { useAuthStore } from '../stores/authStore';
import { useSettingsStore } from '../stores/settingsStore';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock Google Sheets
const mockGetChores = vi.fn();
const mockAddChore = vi.fn();
const mockUpdateChore = vi.fn();
const mockDeleteChore = vi.fn();
vi.mock('../hooks/useGoogleSheets', () => ({
  useGoogleSheets: () => ({
    getChores: mockGetChores,
    addChore: mockAddChore,
    updateChore: mockUpdateChore,
    deleteChore: mockDeleteChore,
    isLoading: false,
    error: null,
    clearError: vi.fn(),
  }),
}));

vi.mock('../hooks/useGoogleAuth', () => ({
  useGoogleAuth: () => ({
    logout: vi.fn(),
  }),
}));

function setParent() {
  useAuthStore.setState({
    isSignedIn: true,
    user: { name: 'Matti', email: 'matti@example.com' },
    role: 'parent',
    accessToken: 'fake-token',
  });
  useSettingsStore.setState({ spreadsheetId: 'sheet-123' });
}

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.setState({
    isSignedIn: false,
    user: null,
    role: null,
    accessToken: null,
  });
  useSettingsStore.setState({ spreadsheetId: '' });
  mockGetChores.mockResolvedValue([]);
});

describe('ChoreManagerView', () => {
  it('redirects to home when not parent', async () => {
    useAuthStore.setState({ isSignedIn: true, role: 'child' });
    useSettingsStore.setState({ spreadsheetId: 'sheet-123' });

    render(<ChoreManagerView />);
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });
  });

  it('loads and displays chores', async () => {
    setParent();
    mockGetChores.mockResolvedValue([
      { id: 'siivous', description: 'Siivous', value: 2, displayName: 'Siivous', rowIndex: 0 },
      { id: 'tiskaus', description: 'Tiskaus', value: 1.5, displayName: 'Tiskaus', rowIndex: 1 },
    ]);

    render(<ChoreManagerView />);
    await waitFor(() => {
      expect(screen.getByText('Siivous')).toBeInTheDocument();
      expect(screen.getByText('Tiskaus')).toBeInTheDocument();
    });
  });

  it('shows "ei askareita" when list is empty', async () => {
    setParent();
    mockGetChores.mockResolvedValue([]);

    render(<ChoreManagerView />);
    await waitFor(() => {
      expect(screen.getByText('Ei askareita. Lisää ensimmäinen!')).toBeInTheDocument();
    });
  });

  it('adds a new chore', async () => {
    setParent();
    mockGetChores.mockResolvedValue([]);

    render(<ChoreManagerView />);
    await waitFor(() => screen.getByPlaceholderText('ID (esim. imurointi)'));

    await userEvent.type(screen.getByPlaceholderText('ID (esim. imurointi)'), 'imurointi');
    await userEvent.type(screen.getByPlaceholderText('Kuvaus'), 'Imuroi lattiat');
    await userEvent.type(screen.getByPlaceholderText('Arvo (€)'), '1.5');

    await userEvent.click(screen.getByText('Lisää'));

    await waitFor(() => {
      expect(mockAddChore).toHaveBeenCalledWith('imurointi', 'Imuroi lattiat', 1.5, 'Imuroi lattiat');
    });
  });

  it('edits an existing chore', async () => {
    setParent();
    const chore = { id: 'siivous', description: 'Siivous', value: 2, displayName: 'Siivous', rowIndex: 0 };
    mockGetChores.mockResolvedValue([chore]);
    mockUpdateChore.mockResolvedValue();

    render(<ChoreManagerView />);
    await waitFor(() => screen.getByText('Siivous'));

    await userEvent.click(screen.getByText('✏️'));

    const descInput = screen.getByPlaceholderText('Kuvaus');
    await userEvent.clear(descInput);
    await userEvent.type(descInput, 'Siivoa keittiö');

    await userEvent.click(screen.getByText('Päivitä'));

    await waitFor(() => {
      expect(mockUpdateChore).toHaveBeenCalledWith(0, 'siivous', 'Siivoa keittiö', 2, 'Siivous');
    });
  });

  it('deletes a chore after confirmation', async () => {
    setParent();
    const chore = { id: 'siivous', description: 'Siivous', value: 2, displayName: 'Siivous', rowIndex: 0 };
    mockGetChores.mockResolvedValue([chore]);
    mockDeleteChore.mockResolvedValue();

    render(<ChoreManagerView />);
    await waitFor(() => screen.getByText('Siivous'));

    await userEvent.click(screen.getByText('🗑️'));

    // Confirmation dialog should appear
    await waitFor(() => screen.getByText('Poista'));
    await userEvent.click(screen.getByText('Poista'));

    await waitFor(() => {
      expect(mockDeleteChore).toHaveBeenCalledWith(0);
    });
  });

  it('cancels delete on "Peru"', async () => {
    setParent();
    const chore = { id: 'siivous', description: 'Siivous', value: 2, displayName: 'Siivous', rowIndex: 0 };
    mockGetChores.mockResolvedValue([chore]);

    render(<ChoreManagerView />);
    await waitFor(() => screen.getByText('Siivous'));

    await userEvent.click(screen.getByText('🗑️'));
    await waitFor(() => screen.getByText('Poista'));
    await userEvent.click(screen.getByText('Peru'));

    expect(mockDeleteChore).not.toHaveBeenCalled();
  });
});
