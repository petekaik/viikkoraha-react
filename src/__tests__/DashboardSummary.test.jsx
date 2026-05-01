import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DashboardSummary from '../components/DashboardSummary';

describe('DashboardSummary', () => {
  it('renders both pending and paid amounts', () => {
    render(<DashboardSummary pending={5.5} totalPaid={42.0} />);
    expect(screen.getByText('5.50€')).toBeInTheDocument();
    expect(screen.getByText('42.00€')).toBeInTheDocument();
  });

  it('renders labels in Finnish', () => {
    render(<DashboardSummary pending={0} totalPaid={0} />);
    expect(screen.getByText('Maksamatta')).toBeInTheDocument();
    expect(screen.getByText('Tienattu')).toBeInTheDocument();
  });

  it('handles zero values', () => {
    render(<DashboardSummary pending={0} totalPaid={0} />);
    // Both cards show 0.00€ → getAllByText returns 2
    const elements = screen.getAllByText('0.00€');
    expect(elements).toHaveLength(2);
  });
});
