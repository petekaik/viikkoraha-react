import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from '../stores/authStore';

beforeEach(() => {
  sessionStorage.clear();
  useAuthStore.setState({
    accessToken: null,
    user: null,
    isSignedIn: false,
    isLoading: false,
  });
});

describe('authStore', () => {
  it('initial state is signed out', () => {
    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.user).toBeNull();
    expect(state.isSignedIn).toBe(false);
  });

  it('setToken updates accessToken and isSignedIn', () => {
    useAuthStore.getState().setToken('test-token');
    const state = useAuthStore.getState();
    expect(state.accessToken).toBe('test-token');
    expect(state.isSignedIn).toBe(true);
  });

  it('setToken(null) sets isSignedIn to false', () => {
    useAuthStore.getState().setToken('test-token');
    useAuthStore.getState().setToken(null);
    expect(useAuthStore.getState().isSignedIn).toBe(false);
  });

  it('setUser stores user object', () => {
    useAuthStore.getState().setUser({ name: 'Matti', email: 'matti@test.fi', imageUrl: '' });
    expect(useAuthStore.getState().user).toEqual({
      name: 'Matti',
      email: 'matti@test.fi',
      imageUrl: '',
    });
  });

  it('signOut clears everything', () => {
    useAuthStore.getState().setToken('test-token');
    useAuthStore.getState().setUser({ name: 'Matti' });
    useAuthStore.getState().signOut();
    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.user).toBeNull();
    expect(state.isSignedIn).toBe(false);
  });

  it('persists to sessionStorage on setToken', () => {
    useAuthStore.getState().setToken('persist-token');
    const stored = JSON.parse(sessionStorage.getItem('viikkoraha-auth'));
    expect(stored.accessToken).toBe('persist-token');
  });

  it('clears sessionStorage on signOut', () => {
    useAuthStore.getState().setToken('persist-token');
    useAuthStore.getState().signOut();
    expect(sessionStorage.getItem('viikkoraha-auth')).toBeNull();
  });
});
