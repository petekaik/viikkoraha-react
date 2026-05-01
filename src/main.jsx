import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router-dom';
import AppShell from './components/AppShell';
import HomeView from './views/HomeView';
import DashboardView from './views/DashboardView';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<HomeView />} />
          <Route path="/dashboard" element={<DashboardView />} />
        </Routes>
      </AppShell>
    </HashRouter>
  </React.StrictMode>,
);
