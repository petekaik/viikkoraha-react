import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HistoryItem from '../components/HistoryItem';

describe('HistoryItem', () => {
  it('renders pending item with odottaa badge', () => {
    const booking = {
      timestamp: '2026-05-01T10:00:00Z',
      choreId: 'siivous',
      description: 'Siivous',
      value: 2,
      status: 'pending',
      userName: 'Matti',
      rowIndex: 0,
    };
    render(<HistoryItem booking={booking} onApprove={vi.fn()} />);
    expect(screen.getByText('Siivous')).toBeInTheDocument();
    expect(screen.getByText('odottaa')).toBeInTheDocument();
    expect(screen.getByText('2.00€')).toBeInTheDocument();
  });

  it('renders paid item with maksettu badge', () => {
    const booking = {
      timestamp: '2026-05-01T10:00:00Z',
      choreId: 'tiskaus',
      description: 'Tiskaus',
      value: 1.5,
      status: 'paid',
      userName: 'Matti',
      rowIndex: 1,
    };
    render(<HistoryItem booking={booking} onApprove={vi.fn()} />);
    expect(screen.getByText('maksettu')).toBeInTheDocument();
  });

  it('calls onApprove when clicked on pending', async () => {
    const onApprove = vi.fn();
    const booking = {
      timestamp: '2026-05-01T10:00:00Z',
      choreId: 'siivous',
      description: 'Siivous',
      value: 2,
      status: 'pending',
      userName: 'Matti',
      rowIndex: 3,
    };
    render(<HistoryItem booking={booking} onApprove={onApprove} />);
    await userEvent.click(screen.getByText('Siivous').closest('div[role="button"]'));
    expect(onApprove).toHaveBeenCalledWith(3);
  });

  it('does not call onApprove when paid item clicked', async () => {
    const onApprove = vi.fn();
    const booking = {
      timestamp: '2026-05-01T10:00:00Z',
      choreId: 'siivous',
      description: 'Siivous',
      value: 2,
      status: 'paid',
      userName: 'Matti',
      rowIndex: 3,
    };
    render(<HistoryItem booking={booking} onApprove={onApprove} />);
    // Paid item should have cursor-default, no role="button"
    expect(screen.queryByRole('button')).toBeNull();
  });
});
