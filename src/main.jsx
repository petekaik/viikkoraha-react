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
// V6: index.html haetaan aina network-first (ei cachea ikinä),
// muut assetit stale-while-revalidate. Pollaa ETagia 5 min välein,
// ilmoittaa päivityksestä UPDATE_AVAILABLE-viestillä.

if ('serviceWorker' in navigator) {
  // Use import.meta.env.BASE_URL for correct path on gh-pages (/viikkoraha/)
  const swPath = `${import.meta.env.BASE_URL}sw.js`;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register(swPath, { scope: import.meta.env.BASE_URL })
      .then(() => console.log('[viikkoraha] SW registered'))
      .catch((e) => console.warn('[viikkoraha] SW registration failed:', e));

    // Listen for update notifications from the SW
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'UPDATE_AVAILABLE') {
        // Show a subtle update banner
        const banner = document.createElement('div');
        banner.style.cssText = `
          position:fixed;bottom:16px;left:50%;transform:translateX(-50%);
          background:#3b82f6;color:#fff;padding:10px 20px;border-radius:12px;
          font-size:14px;font-weight:600;z-index:9999;cursor:pointer;
          box-shadow:0 4px 16px rgba(0,0,0,0.3);animation:slideUp 0.3s ease;
        `;
        // Get language from settings store or default to fi
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
          // Tell SW to skip waiting, then reload
          if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
          }
          window.location.reload();
        });
        document.body.appendChild(banner);
        // Auto-remove after 30s
        setTimeout(() => banner.remove(), 30000);
      }
    });

    // Also listen for controllerchange (when new SW takes over)
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
