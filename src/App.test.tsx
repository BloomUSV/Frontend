import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
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
    expect(screen.queryByText('Utilizatori activi')).not.toBeInTheDocument();
    expect(screen.queryByText('Cereri în așteptare')).not.toBeInTheDocument();
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
    expect(screen.queryByText('Utilizatori activi')).not.toBeInTheDocument();
    expect(screen.queryByText('Cereri recente')).not.toBeInTheDocument();
  });

  it('shows administrator panels only to administrators', async () => {
    renderAs('administrator');

    const navigation = screen.getByRole('navigation', {
      name: 'Navigare principală',
    });
    fireEvent.click(
      within(navigation).getByRole('button', { name: 'Administrare' }),
    );

    expect(await screen.findByText('Utilizatori activi')).toBeInTheDocument();
    expect(screen.getByText('Cereri recente')).toBeInTheDocument();
    await waitFor(() => {
      expect(
        screen.getByText('Controale de gestionare a resurselor'),
      ).toBeInTheDocument();
    });
  });
});
