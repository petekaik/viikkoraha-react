import { useEffect, useCallback, useState, useRef } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useSettingsStore } from '../stores/settingsStore';
import {
  ensureSettingsSheet,
  loadSettingsFromSheet,
  saveSettingsToSheet,
} from '../utils/settingsSync';
import { getDisplayName } from '../utils/displayName';
import { USERS_RANGE, ROLES } from '../utils/sheets-schema';

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
  if (!payload?.exp) return false;
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
              discoveryDocs: [
                'https://sheets.googleapis.com/$discovery/rest?version=v4',
              ],
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
  // Drive API käyttää suoraa fetch(), ei tarvita gapi.client.drive -clienttiä
  return gapiInitialized && !!window.gapi?.client?.sheets;
}

// ── Role resolution ──

/**
 * Look up the current user's role from the Users sheet (by email).
 * If the user is not found, defaults to CHILD.
 */
async function resolveUserRole(spreadsheetId, email) {
  // If we don't have an email yet (token lacks email scope), don't
  // set a default role — let the user see the promote button in settings.
  if (!email || !spreadsheetId) return;
  try {
    const res = await window.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId,
      range: USERS_RANGE,
    });
    const rows = res.result.values || [];
    const userRow = rows.find(
      (r) => r[0] && r[0].trim().toLowerCase() === email.trim().toLowerCase()
    );
    if (userRow) {
      const role = userRow[2] === ROLES.PARENT ? ROLES.PARENT : ROLES.CHILD;
      useAuthStore.getState().setRole(role);
    }
    // If users sheet exists but user not found → role stays null (new user)
  } catch {
    // Sheet doesn't exist yet — leave role null
  }
}

// ── useGoogleAuth hook ──

export function useGoogleAuth() {
  const {
    accessToken, user, isSignedIn,
    setToken, setUser, signOut,
  } = useAuthStore();
  const clientId = useSettingsStore((s) => s.clientId);
  const apiKey = useSettingsStore((s) => s.apiKey);
  const spreadsheetId = useSettingsStore((s) => s.spreadsheetId);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoadingLocal] = useState(true);
  const [gapiReady, setGapiReady] = useState(isGapiReady());

  useEffect(() => {
    if (!isGapiReady()) {
      onGapiReady(() => setGapiReady(true));
    }
  }, []);

  // Restore session from localStorage-persisted authStore on mount.
  useEffect(() => {
    let cancelled = false;

    async function init() {
      await Promise.all([
        loadScript('https://accounts.google.com/gsi/client'),
        loadScript('https://apis.google.com/js/api.js'),
      ]);
      if (cancelled) return;
      gisLoaded = true;
      gapiLoaded = true;

      const authState = useAuthStore.getState();

      if (authState.accessToken) {
        if (isTokenExpired(authState.accessToken)) {
          console.log('[viikkoraha] Stored token expired, clearing');
          useAuthStore.getState().signOut();
          setIsLoadingLocal(false);
          return;
        }
        try {
          const sid = useSettingsStore.getState().spreadsheetId;
          await initGapiClient(useSettingsStore.getState().apiKey, authState.accessToken);
          if (!cancelled) setGapiReady(true);

          // Always fetch fresh userinfo on restore — ensures name/picture
          // are up to date even after scope changes (e.g. adding openid).
          try {
            const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${authState.accessToken}` },
            });
            if (userRes.ok) {
              const profile = await userRes.json();
              useAuthStore.getState().setUser({
                name: getDisplayName(profile),
                email: profile.email || '',
                imageUrl: profile.picture || '',
              });
            }
          } catch (e) {
            console.warn('[viikkoraha] Userinfo fetch on restore failed:', e.message);
          }

          // Auto-load settings from sheet on restore
          if (sid) {
            try {
              await resolveUserRole(sid, useAuthStore.getState().user?.email);
              await loadSettingsFromSheet(sid);
            } catch (e) {
              console.warn('[viikkoraha] Settings load on restore failed:', e.message);
            }
          }
        } catch (e) {
          console.error('[viikkoraha] GAPI session-restore init failed:', e);
        }
      }

      setIsLoadingLocal(false);
    }

    if (!gisLoaded || !gapiLoaded) {
      init();
    } else {
      setIsLoadingLocal(false);
    }

    return () => { cancelled = true; };
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
      scope: 'profile email https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.readonly',
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
              name: getDisplayName(profile),
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

          // Resolve user role + settings from sheet after login
          const sid = useSettingsStore.getState().spreadsheetId;
          if (sid) {
            try {
              await resolveUserRole(sid, useAuthStore.getState().user?.email);
              await ensureSettingsSheet(sid);
              await loadSettingsFromSheet(sid);
            } catch (e) {
              console.warn('[viikkoraha] Settings/role load on login failed:', e.message);
            }
          }
        } catch (e) {
          console.error('[viikkoraha] GAPI init failed:', e);
          setError('Sheets API:n alustus epäonnistui: ' + (e.message || 'tuntematon virhe'));
        }
      },
    });

    // prompt: 'consent' vaaditaan incremental authiin — Google näyttää consent-näkymän
    // jossa KAIKKI pyydetyt scopet (vanhat + uudet) näkyvät. Ilman tätä uusia scopeja
    // (esim. drive.readonly) ei koskaan lisätä tokeniin.
    tokenClient.requestAccessToken({ prompt: 'consent' });
  }, [clientId, apiKey]);

  const logout = useCallback(() => {
    const token = useAuthStore.getState().accessToken;
    if (token && window.google?.accounts?.oauth2?.revoke) {
      window.google.accounts.oauth2.revoke(token, () => {});
    }
    signOut();
    setError(null);
  }, []);

  return {
    login, logout,
    isSignedIn, isLoading,
    gapiReady, error, user,
  };
}

export { isGapiReady, onGapiReady };
