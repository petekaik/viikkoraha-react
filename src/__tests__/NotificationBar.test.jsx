import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotificationBar from '../components/NotificationBar';

describe('NotificationBar', () => {
  it('renders message', () => {
    render(<NotificationBar message="Testi-ilmoitus" type="success" onClose={vi.fn()} />);
    expect(screen.getByText('Testi-ilmoitus')).toBeInTheDocument();
  });

  it('applies success styles', () => {
    render(<NotificationBar message="Ok" type="success" onClose={vi.fn()} />);
    const bar = screen.getByText('Ok').closest('[aria-live]');
    expect(bar.classList.contains('bg-green-600')).toBe(true);
  });

  it('applies error styles', () => {
    render(<NotificationBar message="Virhe" type="error" onClose={vi.fn()} />);
    const bar = screen.getByText('Virhe').closest('[aria-live]');
    expect(bar.classList.contains('bg-red-600')).toBe(true);
  });

  it('applies info styles as default', () => {
    render(<NotificationBar message="Info" onClose={vi.fn()} />);
    const bar = screen.getByText('Info').closest('[aria-live]');
    expect(bar.classList.contains('bg-blue-600')).toBe(true);
  });

  it('calls onClose when close button clicked', async () => {
    const onClose = vi.fn();
    render(<NotificationBar message="Sulje" type="info" onClose={onClose} />);
    await userEvent.click(screen.getByRole('button', { name: 'Sulje' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('returns null when no message', () => {
    const { container } = render(
      <NotificationBar message="" type="info" onClose={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });
});
