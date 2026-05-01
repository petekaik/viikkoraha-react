import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HistoryList from '../components/HistoryList';

const bookings = [
  {
    timestamp: '2026-05-01T10:00:00Z',
    choreId: 'siivous',
    description: 'Siivous',
    value: 2,
    status: 'paid',
    userName: 'Matti',
    rowIndex: 0,
  },
  {
    timestamp: '2026-05-02T10:00:00Z',
    choreId: 'tiskaus',
    description: 'Tiskaus',
    value: 1.5,
    status: 'pending',
    userName: 'Matti',
    rowIndex: 1,
  },
];

describe('HistoryList', () => {
  it('renders empty state', () => {
    render(<HistoryList bookings={[]} onApprove={vi.fn()} />);
    expect(screen.getByText('Ei tehtävähistoriaa')).toBeInTheDocument();
  });

  it('renders week headers', () => {
    render(<HistoryList bookings={bookings} onApprove={vi.fn()} />);
    const weekHeaders = screen.getAllByText((content) => content.startsWith('Viikko '));
    expect(weekHeaders.length).toBeGreaterThan(0);
  });

  it('renders all items', () => {
    render(<HistoryList bookings={bookings} onApprove={vi.fn()} />);
    expect(screen.getByText('Siivous')).toBeInTheDocument();
    expect(screen.getByText('Tiskaus')).toBeInTheDocument();
  });

  it('calls onApprove on pending click', async () => {
    const onApprove = vi.fn();
    render(<HistoryList bookings={bookings} onApprove={onApprove} />);
    // Find the clickable odottaa row
    const approveBtn = screen.getByText('odottaa').closest('[role="button"]');
    expect(approveBtn).toBeTruthy();
    await userEvent.click(approveBtn);
    expect(onApprove).toHaveBeenCalledWith(1);
  });

  it('renders both status badges', () => {
    render(<HistoryList bookings={bookings} onApprove={vi.fn()} />);
    expect(screen.getByText('odottaa')).toBeInTheDocument();
    expect(screen.getByText('maksettu')).toBeInTheDocument();
  });
});
