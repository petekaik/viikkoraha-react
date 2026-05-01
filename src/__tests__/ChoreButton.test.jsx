import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChoreButton from '../components/ChoreButton';

const mockChore = {
  id: 'siivous',
  description: 'Siivous',
  value: 2,
  displayName: 'Siivous',
};

describe('ChoreButton', () => {
  it('renders display name and value', () => {
    render(<ChoreButton chore={mockChore} onClick={vi.fn()} />);
    expect(screen.getByText('Siivous')).toBeInTheDocument();
    expect(screen.getByText('2.00 €')).toBeInTheDocument();
  });

  it('calls onClick with chore', async () => {
    const onClick = vi.fn();
    render(<ChoreButton chore={mockChore} onClick={onClick} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledWith(mockChore);
  });

  it('renders SVG icon', () => {
    const { container } = render(<ChoreButton chore={mockChore} onClick={vi.fn()} />);
    expect(container.querySelector('svg')).toBeTruthy();
  });
});
