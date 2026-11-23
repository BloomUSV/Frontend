import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import App from './App';
import { useAuth } from './context/AuthContext';
import type { AuthUser } from './types/resource';

vi.mock('./context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  useAuth: vi.fn(),
}));

vi.mock('./hooks/useResourceList', () => ({
  useResourceList: () => ({
    resources: [],
    pagination: { page: 1, pageSize: 100, totalItems: 0, totalPages: 0 },
    loading: false,
    error: null,
    refresh: vi.fn(),
  }),
}));

vi.mock('./services/userService', () => ({
  listUsers: vi.fn().mockResolvedValue([]),
  updateUser: vi.fn().mockResolvedValue({}),
}));

vi.mock('./components/ResourceManagement', () => ({
  default: () => <div>Controale de gestionare a resurselor</div>,
}));

const user: AuthUser = {
  id: 'd1b3efc4-48f4-4ec1-9af0-47eccb939600',
  fullName: 'Andrei Ionescu',
  email: 'andrei@example.edu',
  role: 'user',
  isActive: true,
  createdAt: '2025-01-15T10:00:00Z',
  updatedAt: '2025-01-15T10:00:00Z',
};

function renderAs(role: AuthUser['role']) {
  vi.mocked(useAuth).mockReturnValue({
    user: { ...user, role },
    isLoading: false,
    error: null,
    login: vi.fn(),
    logout: vi.fn(),
  });

  return render(<App />);
}

describe('role-based navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hides manager and administrator navigation from regular users', () => {
    renderAs('user');

    const navigation = screen.getByRole('navigation', {
      name: 'Navigare principală',
    });

    expect(
      within(navigation).queryByRole('button', {
        name: 'Administrare',
      }),
    ).not.toBeInTheDocument();
    expect(
      within(navigation).queryByRole('button', {
        name: 'Gestionarea resurselor',
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('Controale de gestionare a resurselor'),
    ).not.toBeInTheDocument();
  });

  it('shows resource management but not administrator UI to managers', async () => {
    renderAs('manager');

    const navigation = screen.getByRole('navigation', {
      name: 'Navigare principală',
    });
    fireEvent.click(
      within(navigation).getByRole('button', {
        name: 'Gestionarea resurselor',
      }),
    );

    expect(
      await screen.findByText('Controale de gestionare a resurselor'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Utilizatori și roluri')).not.toBeInTheDocument();
  });

  it('shows resource and user administration controls to administrators', async () => {
    renderAs('administrator');

    const navigation = screen.getByRole('navigation', {
      name: 'Navigare principală',
    });
    fireEvent.click(
      within(navigation).getByRole('button', { name: 'Administrare' }),
    );

    expect(
      await screen.findByText('Utilizatori și roluri'),
    ).toBeInTheDocument();
    expect(
      await screen.findByText('Controale de gestionare a resurselor'),
    ).toBeInTheDocument();
  });

  it('limits reservation dates to the present and later', async () => {
    renderAs('user');
    fireEvent.click(screen.getByRole('button', { name: 'Rezervare nouă' }));

    const start = await screen.findByLabelText('Început');
    const end = screen.getByLabelText('Sfârșit');
    const startMinimum = start.getAttribute('min');
    const endMinimum = end.getAttribute('min');

    expect(startMinimum).not.toBeNull();
    expect(endMinimum).toBe(startMinimum);
    expect(new Date(startMinimum!).getTime()).toBeGreaterThanOrEqual(
      Date.now() - 1000,
    );

    fireEvent.change(start, { target: { value: startMinimum } });
    expect(end.getAttribute('min')! > startMinimum!).toBe(true);
  });
});
