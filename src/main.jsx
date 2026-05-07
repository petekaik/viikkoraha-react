import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router-dom';
import AppShell from './components/AppShell';
import HomeView from './views/HomeView';
import DashboardView from './views/DashboardView';
import ChoreManagerView from './views/ChoreManagerView';
import UsersManagerView from './views/UsersManagerView';
import { translations } from './i18n/translations';
import './index.css';

// ── Service Worker ──
// SW pollaa build.json:ia 5 min välein. iOS tappaa SW:n setIntervalin
// nopeasti, joten app-puolella on oma 2 min pollaus suoraan build.json:sta.

const BUILD_JSON_URL = `${import.meta.env.BASE_URL}build.json`;
const APP_POLL_MS = 2 * 60 * 1000; // 2 min — app-puolen pollaus
const STORAGE_KEY = 'viikkoraha-last-build-id';

async function checkForUpdateDirect() {
  try {
    const res = await fetch(BUILD_JSON_URL, {
      cache: 'no-cache',
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
    });
    if (!res.ok) return;
    const data = await res.json();
    const newId = data.buildId;
    if (!newId) return;

    const lastId = localStorage.getItem(STORAGE_KEY);
    if (lastId && newId !== lastId) {
      showUpdateBanner();
    }
  } catch { /* offline — ignore */ }
}

function markBuildCurrent(buildId) {
  localStorage.setItem(STORAGE_KEY, buildId);
}

// Näytä banneri (sama kuin SW:n UPDATE_AVAILABLE-käsittelijä)
function showUpdateBanner() {
  const existing = document.getElementById('viikkoraha-update-banner');
  if (existing) return;

  const banner = document.createElement('div');
  banner.id = 'viikkoraha-update-banner';
  banner.style.cssText = `
    position:fixed;bottom:16px;left:50%;transform:translateX(-50%);
    background:#3b82f6;color:#fff;padding:10px 20px;border-radius:12px;
    font-size:14px;font-weight:600;z-index:9999;cursor:pointer;
    box-shadow:0 4px 16px rgba(0,0,0,0.3);animation:slideUp 0.3s ease;
  `;
  const lang = (() => {
    try {
      const raw = localStorage.getItem('viikkoraha-settings');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.state?.language && translations[parsed.state.language]) {
          return parsed.state.language;
        }
      }
    } catch { /* fallthrough */ }
    return 'fi';
  })();
  banner.textContent = translations[lang]?.ui?.app?.updateBanner || '🔄 Uusi versio — päivitä napauttamalla';
  banner.addEventListener('click', () => {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
    }
    window.location.reload();
  });
  document.body.appendChild(banner);
  setTimeout(() => banner.remove(), 60000);
}

if ('serviceWorker' in navigator) {
  const swPath = `${import.meta.env.BASE_URL}sw.js`;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register(swPath, { scope: import.meta.env.BASE_URL })
      .then(() => console.log('[viikkoraha] SW registered'))
      .catch((e) => console.warn('[viikkoraha] SW registration failed:', e));

    // App-puolen pollaus — ei riipu SW:stä, toimii iOS:llä
    fetch(BUILD_JSON_URL, { cache: 'no-cache' })
      .then(r => r.json())
      .then(data => data.buildId && markBuildCurrent(data.buildId))
      .catch(() => {});

    setInterval(checkForUpdateDirect, APP_POLL_MS);

    // SW-viesti fallback (jos SW sattuu olemaan hereillä)
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'UPDATE_AVAILABLE') {
        showUpdateBanner();
      }
    });

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  });
}

// ── Render ──

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<HomeView />} />
          <Route path="/dashboard" element={<DashboardView />} />
          <Route path="/admin/chores" element={<ChoreManagerView />} />
          <Route path="/admin/users" element={<UsersManagerView />} />
        </Routes>
      </AppShell>
    </HashRouter>
  </React.StrictMode>,
);
