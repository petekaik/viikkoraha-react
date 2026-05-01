import { useEffect, useCallback, useState, useRef } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useSettingsStore } from '../stores/settingsStore';

let gisLoaded = false;
let gapiLoaded = false;

// ── Token helpers ──

function parseJwt(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch { return null; }
}

function isTokenExpired(token) {
  if (!token) return true;
  const payload = parseJwt(token);
  if (!payload?.exp) return false; // no exp claim → assume valid
  return Date.now() >= payload.exp * 1000;
}

// ── Script loader ──

function loadScript(src) {
  return new Promise((resolve) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.defer = true;
    s.onload = resolve;
    s.onerror = resolve;
    document.head.appendChild(s);
  });
}

// ── GAPI client init (shared, called once) ──

let gapiInitialized = false;
let gapiInitPromise = null;
let gapiReadyListeners = [];

function notifyReady() {
  gapiReadyListeners.forEach(fn => fn());
  gapiReadyListeners = [];
}

function onGapiReady(fn) {
  if (gapiInitialized) { fn(); return; }
  gapiReadyListeners.push(fn);
}

async function initGapiClient(apiKey, token) {
  if (gapiInitialized) {
    window.gapi.client.setToken({ access_token: token });
    return;
  }

  if (gapiInitPromise) {
    await gapiInitPromise;
    window.gapi.client.setToken({ access_token: token });
    return;
  }

  gapiInitPromise = (async () => {
    return new Promise((resolve, reject) => {
      window.gapi.load('client', {
        callback: async () => {
          try {
            await window.gapi.client.init({
              apiKey,
              discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
            });
            gapiInitialized = true;
            notifyReady();
            resolve();
          } catch (e) {
            reject(e);
          }
        },
        onerror: () => reject(new Error('gapi.load epäonnistui')),
        timeout: 15000,
        ontimeout: () => reject(new Error('gapi.load aikakatkaistu')),
      });
    });
  })();

  try {
    await gapiInitPromise;
    window.gapi.client.setToken({ access_token: token });
  } catch (e) {
    gapiInitPromise = null;
    throw e;
  }
}

function isGapiReady() {
  return gapiInitialized && !!window.gapi?.client?.sheets;
}

// ── useGoogleAuth hook ──

export function useGoogleAuth() {
  const {
    accessToken, user, isSignedIn,
    setToken, setUser, signOut,
  } = useAuthStore();
  const clientId = useSettingsStore((s) => s.clientId);
  const apiKey = useSettingsStore((s) => s.apiKey);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoadingLocal] = useState(true);
  // Reactive GAPI-ready state
  const [gapiReady, setGapiReady] = useState(isGapiReady());

  useEffect(() => {
    if (!isGapiReady()) {
      onGapiReady(() => setGapiReady(true));
    }
  }, []);

  useEffect(() => {
    async function init() {
      await Promise.all([
        loadScript('https://accounts.google.com/gsi/client'),
        loadScript('https://apis.google.com/js/api.js'),
      ]);
      gisLoaded = true;
      gapiLoaded = true;

      const stored = sessionStorage.getItem('viikkoraha-auth');
      if (stored) {
        try {
          const data = JSON.parse(stored);
          if (data.accessToken) {
            // Skip expired tokens — user needs to re-login
            if (isTokenExpired(data.accessToken)) {
              console.log('Stored token expired, clearing session');
              sessionStorage.removeItem('viikkoraha-auth');
              setIsLoadingLocal(false);
              return;
            }
            setToken(data.accessToken);
            if (data.user) setUser(data.user);
            try {
              await initGapiClient(useSettingsStore.getState().apiKey, data.accessToken);
              setGapiReady(true);
            } catch (e) {
              console.error('GAPI session-restore init failed:', e);
            }
            setIsLoadingLocal(false);
            return;
          }
        } catch { /* ignore */ }
      }
      setIsLoadingLocal(false);
    }
    if (!gisLoaded || !gapiLoaded) {
      init();
    } else {
      const stored = sessionStorage.getItem('viikkoraha-auth');
      if (stored) {
        try {
          const data = JSON.parse(stored);
          if (data.accessToken) {
            setIsLoadingLocal(false);
            return;
          }
        } catch {}
      }
      setIsLoadingLocal(false);
    }
  }, []);

  const login = useCallback(() => {
    if (!clientId) {
      setError('Client ID puuttuu. Syötä asetukset ensin.');
      return;
    }
    if (!window.google?.accounts?.oauth2) {
      setError('Google-kirjautuminen ei ole vielä latautunut. Yritä hetken kuluttua uudelleen.');
      return;
    }

    setError(null);
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      callback: async (tokenResponse) => {
        if (tokenResponse.error) {
          setError(tokenResponse.error_description || tokenResponse.error);
          return;
        }

        const token = tokenResponse.access_token;
        setToken(token);

        try {
          const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const profile = await res.json();
            setUser({
              name: profile.name || 'Käyttäjä',
              email: profile.email || '',
              imageUrl: profile.picture || '',
            });
          } else {
            setUser({ name: 'Käyttäjä', email: '', imageUrl: '' });
          }
        } catch {
          setUser({ name: 'Käyttäjä', email: '', imageUrl: '' });
        }

        try {
          await initGapiClient(apiKey, token);
          setGapiReady(true);
        } catch (e) {
          console.error('GAPI init failed:', e);
          setError('Sheets API:n alustus epäonnistui: ' + (e.message || 'tuntematon virhe'));
        }
      },
    });

    tokenClient.requestAccessToken({ prompt: 'consent' });
  }, [clientId, apiKey]);

  const logout = useCallback(() => {
    const token = accessToken;
    if (token && window.google?.accounts?.oauth2?.revoke) {
      window.google.accounts.oauth2.revoke(token, () => {});
    }
    signOut();
    setError(null);
  }, [accessToken]);

  return {
    login,
    logout,
    isSignedIn,
    isLoading,
    gapiReady,
    error,
    user,
  };
}

export { isGapiReady };
