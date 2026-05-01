import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChoreList from '../components/ChoreList';

const chores = [
  { id: 'siivous', description: 'Siivous', value: 2, displayName: 'Siivous' },
  { id: 'tiskaus', description: 'Tiskaus', value: 1.5, displayName: 'Tiskaus' },
];

describe('ChoreList', () => {
  it('renders multiple chore buttons', () => {
    render(<ChoreList chores={chores} onSelect={vi.fn()} />);
    expect(screen.getByText('Siivous')).toBeInTheDocument();
    expect(screen.getByText('Tiskaus')).toBeInTheDocument();
  });

  it('calls onSelect when chore clicked', async () => {
    const onSelect = vi.fn();
    render(<ChoreList chores={chores} onSelect={onSelect} />);
    await userEvent.click(screen.getByText('Siivous').closest('button'));
    expect(onSelect).toHaveBeenCalledWith(chores[0]);
  });

  it('shows loading text when empty', () => {
    render(<ChoreList chores={[]} onSelect={vi.fn()} />);
    expect(screen.getByText('Ladataan...')).toBeInTheDocument();
  });

  it('shows loading text when null', () => {
    render(<ChoreList chores={null} onSelect={vi.fn()} />);
    expect(screen.getByText('Ladataan...')).toBeInTheDocument();
  });
});
