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
    render(<HistoryItem booking={booking} />);
    expect(screen.getByText('Siivous')).toBeInTheDocument();
    expect(screen.getByText('odottaa')).toBeInTheDocument();
    // Comma decimal (Finnish locale formatting)
    expect(screen.getByText('2,00€')).toBeInTheDocument();
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
    render(<HistoryItem booking={booking} />);
    expect(screen.getByText('maksettu')).toBeInTheDocument();
  });

  it('shows pendingParent text for pending items when not parent', () => {
    const booking = {
      timestamp: '2026-05-01T10:00:00Z',
      choreId: 'siivous',
      description: 'Siivous',
      value: 2,
      status: 'pending',
      userName: 'Matti',
      rowIndex: 3,
    };
    render(<HistoryItem booking={booking} isExpanded={true} isParent={false} />);
    expect(screen.getByText('odottaa vanhemman hyväksyntää')).toBeInTheDocument();
    // Toimintonapit EI näy
    expect(screen.queryByText('✅ Hyväksy')).not.toBeInTheDocument();
  });

  it('expands on click and shows approve/reject buttons for pending', async () => {
    const onApprove = vi.fn();
    const onReject = vi.fn();
    const booking = {
      timestamp: '2026-05-01T10:00:00Z',
      choreId: 'siivous',
      description: 'Siivous',
      value: 2,
      status: 'pending',
      userName: 'Matti',
      rowIndex: 3,
    };
    const { rerender } = render(
      <HistoryItem booking={booking} onApprove={onApprove} onReject={onReject} isParent={true} />
    );

    // Click to expand
    const row = screen.getByText('Siivous').closest('[role="button"]');
    await userEvent.click(row);

    // Rerender with isExpanded=true (parent handles this)
    rerender(
      <HistoryItem
        booking={booking}
        onApprove={onApprove}
        onReject={onReject}
        isExpanded={true}
        isParent={true}
      />
    );

    // Now approve button should be visible
    const approveBtn = screen.getByText('✅ Hyväksy');
    await userEvent.click(approveBtn);
    expect(onApprove).toHaveBeenCalledWith(3);
  });

  it('shows unpay button for paid items when expanded', async () => {
    const onUnpay = vi.fn();
    const booking = {
      timestamp: '2026-05-01T10:00:00Z',
      choreId: 'siivous',
      description: 'Siivous',
      value: 2,
      status: 'paid',
      userName: 'Matti',
      rowIndex: 3,
      approvedBy: 'Pomo',
      approvedAt: '2026-05-02T12:00:00Z',
    };
    const { rerender } = render(<HistoryItem booking={booking} onUnpay={onUnpay} isParent={true} />);

    const row = screen.getByText('Siivous').closest('[role="button"]');
    await userEvent.click(row);

    rerender(<HistoryItem booking={booking} onUnpay={onUnpay} isExpanded={true} isParent={true} />);

    const unpayBtn = screen.getByText('↩️ Palauta odottavaksi');
    await userEvent.click(unpayBtn);
    expect(onUnpay).toHaveBeenCalledWith(3);
  });

  it('shows unpay button for rejected items when expanded', async () => {
    const onUnpay = vi.fn();
    const booking = {
      timestamp: '2026-05-01T10:00:00Z',
      choreId: 'siivous',
      description: 'Siivous',
      value: 2,
      status: 'rejected',
      userName: 'Matti',
      rowIndex: 3,
      approvedBy: 'Pomo',
      approvedAt: '2026-05-02T12:00:00Z',
    };
    const { rerender } = render(<HistoryItem booking={booking} onUnpay={onUnpay} isParent={true} />);

    const row = screen.getByText('Siivous').closest('[role="button"]');
    await userEvent.click(row);

    rerender(<HistoryItem booking={booking} onUnpay={onUnpay} isExpanded={true} isParent={true} />);

    const unpayBtn = screen.getByText('↩️ Palauta odottavaksi');
    await userEvent.click(unpayBtn);
    expect(onUnpay).toHaveBeenCalledWith(3);
  });

  it('shows approve button for rejected items when expanded', async () => {
    const onApprove = vi.fn();
    const booking = {
      timestamp: '2026-05-01T10:00:00Z',
      choreId: 'siivous',
      description: 'Siivous',
      value: 2,
      status: 'rejected',
      userName: 'Matti',
      rowIndex: 3,
      approvedBy: 'Pomo',
      approvedAt: '2026-05-02T12:00:00Z',
    };
    const { rerender } = render(<HistoryItem booking={booking} onApprove={onApprove} isParent={true} />);

    const row = screen.getByText('Siivous').closest('[role="button"]');
    await userEvent.click(row);

    rerender(<HistoryItem booking={booking} onApprove={onApprove} isExpanded={true} isParent={true} />);

    const approveBtn = screen.getByText('✅ Hyväksy');
    await userEvent.click(approveBtn);
    expect(onApprove).toHaveBeenCalledWith(3);
  });

  it('shows approver info when expanded', async () => {
    const booking = {
      timestamp: '2026-05-01T10:00:00Z',
      choreId: 'siivous',
      description: 'Siivous',
      value: 2,
      status: 'paid',
      userName: 'Matti',
      rowIndex: 3,
      approvedBy: 'Pomo',
      approvedAt: '2026-05-02T12:00:00Z',
    };
    const { rerender } = render(<HistoryItem booking={booking} />);

    const row = screen.getByText('Siivous').closest('[role="button"]');
    await userEvent.click(row);

    rerender(<HistoryItem booking={booking} isExpanded={true} />);

    expect(screen.getByText(/Pomo/)).toBeInTheDocument();
  });
});
