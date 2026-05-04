import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UsersManagerView from '../views/UsersManagerView';
import { useAuthStore } from '../stores/authStore';
import { useSettingsStore } from '../stores/settingsStore';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock useTranslation — return Finnish translations
vi.mock('../i18n/useTranslation', () => ({
  useTranslation: () => ({
    t: (key, params) => {
      const fi = {
        'ui.admin.back': 'Takaisin',
        'ui.admin.loginRequired': 'Kirjaudu sisään.',
        'ui.admin.selectSpreadsheetFirst': 'Valitse taulukko ensin.',
        'ui.admin.saveFailed': 'Tallennus epäonnistui.',
        'ui.admin.deleteFailed': 'Poisto epäonnistui.',
        'ui.admin.saving': 'Tallennetaan...',
        'ui.admin.update': 'Päivitä',
        'ui.admin.add': 'Lisää',
        'ui.admin.cancel': 'Peru',
        'ui.admin.delete': 'Poista',
        'ui.admin.loading': 'Ladataan...',
        'ui.admin.irreversible': 'Tätä ei voi perua.',
        'ui.admin.users.management': 'Perheenjäsenten hallinta',
        'ui.admin.users.addMember': 'Lisää perheenjäsen',
        'ui.admin.users.editing': `Muokataan: ${params?.name || ''}`,
        'ui.admin.users.emailPlaceholder': 'Sähköposti (Google-tili)',
        'ui.admin.users.namePlaceholder': 'Nimi (näytetään sovelluksessa)',
        'ui.admin.users.roleChild': 'Lapsi — voi varata askareita',
        'ui.admin.users.roleParent': 'Vanhempi — voi hallita kaikkea',
        'ui.admin.users.roleParentShort': 'vanhempi',
        'ui.admin.users.roleChildShort': 'lapsi',
        'ui.admin.users.noMembers': 'Ei perheenjäseniä. Lisää ensimmäinen!',
        'ui.admin.users.formValidation': 'Täytä sähköposti ja nimi.',
        'ui.admin.users.invalidEmail': 'Sähköposti ei ole kelvollinen.',
        'ui.admin.users.duplicate': 'Käyttäjä on jo listalla.',
        'ui.admin.users.updated': 'Käyttäjä päivitetty.',
        'ui.admin.users.added': 'Käyttäjä lisätty.',
        'ui.admin.users.deleted': `"${params?.name || ''}" poistettu.`,
        'ui.admin.users.confirmDelete': `Poistetaanko "${params?.name || ''}"?`,
        'ui.admin.users.editLabel': `Muokkaa käyttäjää ${params?.name || ''}`,
        'ui.admin.users.deleteLabel': `Poista käyttäjä ${params?.name || ''}`,
        'ui.unknownUser': 'Käyttäjä',
      };
      return fi[key] || key;
    },
    language: 'fi',
    setLanguage: vi.fn(),
  }),
}));

// Mock useUsers
const mockGetUsers = vi.fn();
const mockSaveUsers = vi.fn();
vi.mock('../hooks/useUsers', () => ({
  useUsers: () => ({
    getUsers: mockGetUsers,
    saveUsers: mockSaveUsers,
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
  mockGetUsers.mockResolvedValue([]);
  mockSaveUsers.mockResolvedValue();
});

describe('UsersManagerView', () => {
  it('shows login prompt when not signed in', () => {
    render(<UsersManagerView />);
    expect(screen.getByText('Kirjaudu sisään.')).toBeInTheDocument();
  });

  it('shows sheet prompt when no spreadsheet selected', () => {
    useAuthStore.setState({ isSignedIn: true, role: 'parent' });
    render(<UsersManagerView />);
    expect(screen.getByText('Valitse taulukko ensin.')).toBeInTheDocument();
  });

  it('redirects non-parents to home', async () => {
    useAuthStore.setState({ isSignedIn: true, role: 'child' });
    useSettingsStore.setState({ spreadsheetId: 'sheet-123' });

    render(<UsersManagerView />);
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });
  });

  it('loads and displays users', async () => {
    setParent();
    mockGetUsers.mockResolvedValue([
      { email: 'matti@example.com', name: 'Matti', role: 'parent' },
      { email: 'liisa@example.com', name: 'Liisa', role: 'child' },
    ]);

    render(<UsersManagerView />);
    await waitFor(() => {
      expect(screen.getByText('Matti')).toBeInTheDocument();
      expect(screen.getByText('Liisa')).toBeInTheDocument();
    });
  });

  it('shows role badges for parent and child', async () => {
    setParent();
    mockGetUsers.mockResolvedValue([
      { email: 'matti@example.com', name: 'Matti', role: 'parent' },
      { email: 'liisa@example.com', name: 'Liisa', role: 'child' },
    ]);

    render(<UsersManagerView />);
    await waitFor(() => {
      expect(screen.getByText('(vanhempi)')).toBeInTheDocument();
      expect(screen.getByText('(lapsi)')).toBeInTheDocument();
    });
  });

  it('shows "ei perheenjäseniä" when list is empty', async () => {
    setParent();
    mockGetUsers.mockResolvedValue([]);

    render(<UsersManagerView />);
    await waitFor(() => {
      expect(
        screen.getByText('Ei perheenjäseniä. Lisää ensimmäinen!')
      ).toBeInTheDocument();
    });
  });

  it('adds a new user', async () => {
    setParent();
    mockGetUsers.mockResolvedValue([]);

    render(<UsersManagerView />);
    await waitFor(() => screen.getByPlaceholderText('Sähköposti (Google-tili)'));

    await userEvent.type(
      screen.getByPlaceholderText('Sähköposti (Google-tili)'),
      'liisa@example.com'
    );
    await userEvent.type(
      screen.getByPlaceholderText('Nimi (näytetään sovelluksessa)'),
      'Liisa'
    );
    await userEvent.selectOptions(
      screen.getByRole('combobox'),
      'child'
    );

    await userEvent.click(screen.getByText('Lisää'));

    await waitFor(() => {
      expect(mockSaveUsers).toHaveBeenCalledWith([
        { email: 'liisa@example.com', name: 'Liisa', role: 'child' },
      ]);
    });
  });

  it('prevents duplicate emails', async () => {
    setParent();
    mockGetUsers.mockResolvedValue([
      { email: 'liisa@example.com', name: 'Liisa', role: 'child' },
    ]);

    render(<UsersManagerView />);
    await waitFor(() => screen.getByPlaceholderText('Sähköposti (Google-tili)'));

    await userEvent.type(
      screen.getByPlaceholderText('Sähköposti (Google-tili)'),
      'liisa@example.com'
    );
    await userEvent.type(
      screen.getByPlaceholderText('Nimi (näytetään sovelluksessa)'),
      'Liisa2'
    );

    await userEvent.click(screen.getByText('Lisää'));

    await waitFor(() => {
      expect(screen.getByText('Käyttäjä on jo listalla.')).toBeInTheDocument();
    });
    expect(mockSaveUsers).not.toHaveBeenCalled();
  });

  it('validates email format', async () => {
    setParent();
    mockGetUsers.mockResolvedValue([]);

    render(<UsersManagerView />);
    await waitFor(() => screen.getByPlaceholderText('Sähköposti (Google-tili)'));

    await userEvent.type(
      screen.getByPlaceholderText('Sähköposti (Google-tili)'),
      'ei-email'
    );
    await userEvent.type(
      screen.getByPlaceholderText('Nimi (näytetään sovelluksessa)'),
      'X'
    );

    const form = document.querySelector('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(
        screen.getByText('Sähköposti ei ole kelvollinen.')
      ).toBeInTheDocument();
    });
  });

  it('requires name field', async () => {
    setParent();
    mockGetUsers.mockResolvedValue([]);

    render(<UsersManagerView />);
    await waitFor(() => screen.getByPlaceholderText('Sähköposti (Google-tili)'));

    await userEvent.type(
      screen.getByPlaceholderText('Sähköposti (Google-tili)'),
      'test@example.com'
    );

    await userEvent.click(screen.getByText('Lisää'));

    await waitFor(() => {
      expect(screen.getByText('Täytä sähköposti ja nimi.')).toBeInTheDocument();
    });
  });

  it('edits an existing user', async () => {
    setParent();
    mockGetUsers.mockResolvedValue([
      { email: 'liisa@example.com', name: 'Liisa', role: 'child' },
    ]);

    render(<UsersManagerView />);
    await waitFor(() => screen.getByText('Liisa'));

    await userEvent.click(screen.getByRole('button', { name: /Muokkaa käyttäjää Liisa/ }));

    const nameInput = screen.getByPlaceholderText('Nimi (näytetään sovelluksessa)');
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Liisa K.');
    await userEvent.selectOptions(screen.getByRole('combobox'), 'parent');

    await userEvent.click(screen.getByText('Päivitä'));

    await waitFor(() => {
      expect(mockSaveUsers).toHaveBeenCalledWith([
        { email: 'liisa@example.com', name: 'Liisa K.', role: 'parent' },
      ]);
    });
  });

  it('deletes a user after confirmation', async () => {
    setParent();
    mockGetUsers.mockResolvedValue([
      { email: 'liisa@example.com', name: 'Liisa', role: 'child' },
    ]);

    render(<UsersManagerView />);
    await waitFor(() => screen.getByText('Liisa'));

    await userEvent.click(screen.getByRole('button', { name: /Poista käyttäjä Liisa/ }));

    // Confirmation dialog
    await waitFor(() => screen.getByText('Liisa'));
    await userEvent.click(screen.getByText('Poista'));

    await waitFor(() => {
      expect(mockSaveUsers).toHaveBeenCalledWith([]);
    });
  });

  it('cancels delete on "Peru"', async () => {
    setParent();
    mockGetUsers.mockResolvedValue([
      { email: 'liisa@example.com', name: 'Liisa', role: 'child' },
    ]);

    render(<UsersManagerView />);
    await waitFor(() => screen.getByText('Liisa'));

    await userEvent.click(screen.getByRole('button', { name: /Poista käyttäjä Liisa/ }));
    await waitFor(() => screen.getByText('Poista'));
    await userEvent.click(screen.getByText('Peru'));

    expect(mockSaveUsers).not.toHaveBeenCalled();
  });
});
