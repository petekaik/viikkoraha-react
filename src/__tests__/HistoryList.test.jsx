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
    render(<HistoryList bookings={[]} />);
    expect(screen.getByText('Ei tehtävähistoriaa')).toBeInTheDocument();
  });

  it('renders week headers', () => {
    render(<HistoryList bookings={bookings} />);
    const weekHeaders = screen.getAllByText((content) => content.startsWith('Viikko '));
    expect(weekHeaders.length).toBeGreaterThan(0);
  });

  it('renders all items', () => {
    render(<HistoryList bookings={bookings} />);
    expect(screen.getByText('Siivous')).toBeInTheDocument();
    expect(screen.getByText('Tiskaus')).toBeInTheDocument();
  });

  it('expands item on click and shows approve button', async () => {
    const onApprove = vi.fn();
    render(
      <HistoryList bookings={bookings} onApprove={onApprove} onReject={vi.fn()} onUnpay={vi.fn()} />
    );

    // Click the pending item to expand
    const pendingRow = screen.getByText('Tiskaus').closest('[role="button"]');
    await userEvent.click(pendingRow);

    // Approve button should be visible
    const approveBtn = screen.getByText('✅ Hyväksy');
    expect(approveBtn).toBeTruthy();

    await userEvent.click(approveBtn);
    expect(onApprove).toHaveBeenCalledWith(1);
  });

  it('renders both status badges', () => {
    render(<HistoryList bookings={bookings} />);
    expect(screen.getByText('odottaa')).toBeInTheDocument();
    expect(screen.getByText('maksettu')).toBeInTheDocument();
  });
});
