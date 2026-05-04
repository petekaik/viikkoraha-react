import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import WeeklyChart from '../components/WeeklyChart';

// Mock useTranslation — return Finnish translations
vi.mock('../i18n/useTranslation', () => ({
  useTranslation: () => ({
    t: (key) => {
      const fi = {
        'ui.chart.empty': 'Ei dataa graafiin vielä.',
        'ui.chart.weekPrefix': 'V',
        'ui.statusLong.paid': 'Maksettu',
        'ui.status.pending': 'odottaa',
      };
      return fi[key] || key;
    },
    language: 'fi',
    setLanguage: vi.fn(),
  }),
}));

// Mock useLanguageStore — return 'fi' so formatWeekLabel uses Finnish
vi.mock('../stores/languageStore', () => ({
  useLanguageStore: (selector) => selector({ language: 'fi' }),
}));

// Week 15: Mon Apr 6 2026, Week 16: Mon Apr 13, Week 17: Mon Apr 20
const sampleBookings = [
  { timestamp: '2026-04-06T10:00:00Z', value: 5, status: 'paid' },
  { timestamp: '2026-04-07T10:00:00Z', value: 3, status: 'paid' },
  { timestamp: '2026-04-08T10:00:00Z', value: 2, status: 'pending' },
  { timestamp: '2026-04-14T10:00:00Z', value: 4, status: 'paid' },
  { timestamp: '2026-04-15T10:00:00Z', value: 1, status: 'pending' },
  { timestamp: '2026-04-20T10:00:00Z', value: 6, status: 'paid' },
];

describe('WeeklyChart', () => {
  it('shows empty state when no bookings', () => {
    render(<WeeklyChart bookings={[]} />);
    expect(screen.getByText('Ei dataa graafiin vielä.')).toBeInTheDocument();
  });

  it('shows empty state when null', () => {
    render(<WeeklyChart bookings={null} />);
    expect(screen.getByText('Ei dataa graafiin vielä.')).toBeInTheDocument();
  });

  it('renders SVG with correct role', () => {
    render(<WeeklyChart bookings={sampleBookings} />);
    const svg = screen.getByRole('img', { name: 'Viikkokohtainen ansaintagraafi' });
    expect(svg).toBeInTheDocument();
  });

  it('renders week labels (ISO weeks from timestamps)', () => {
    render(<WeeklyChart bookings={sampleBookings} />);
    expect(screen.getByText('2026 · Viikko 15')).toBeInTheDocument();
    expect(screen.getByText('2026 · Viikko 16')).toBeInTheDocument();
    expect(screen.getByText('2026 · Viikko 17')).toBeInTheDocument();
  });

  it('renders legend', () => {
    render(<WeeklyChart bookings={sampleBookings} />);
    expect(screen.getByText('Maksettu')).toBeInTheDocument();
    expect(screen.getByText('odottaa')).toBeInTheDocument();
  });

  it('renders value labels on bars', () => {
    const { container } = render(<WeeklyChart bookings={sampleBookings} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    const texts = Array.from(svg.querySelectorAll('text')).map((t) => t.textContent);
    expect(texts.filter((t) => t === '10€').length).toBeGreaterThanOrEqual(1);
    expect(texts.filter((t) => t === '6€').length).toBeGreaterThanOrEqual(1);
    expect(texts.filter((t) => t === '5€').length).toBeGreaterThanOrEqual(1);
  });
});
