import { useState } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import App from './App';
import { useAuth } from './context/AuthContext';
import * as reservationService from './services/reservationService';
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

vi.mock('./services/reservationService', () => ({
  cancelReservation: vi.fn(),
  createReservation: vi.fn(),
  listReservations: vi.fn().mockResolvedValue([]),
  reviewReservation: vi.fn(),
  updateReservation: vi.fn(),
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
    register: vi.fn(),
    logout: vi.fn(),
  });

  return render(<App />);
}

function renderUnauthenticated(
  register = vi.fn().mockResolvedValue(undefined),
) {
  vi.mocked(useAuth).mockReturnValue({
    user: null,
    isLoading: false,
    error: null,
    login: vi.fn().mockResolvedValue(undefined),
    register,
    logout: vi.fn(),
  });

  return { ...render(<App />), register };
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

  it('allows managers to confirm pending reservations', async () => {
    const pendingReservation = {
      id: 'reservation-1',
      userId: user.id,
      resourceId: 'resource-1',
      startsAt: '2026-12-01T10:00:00Z',
      endsAt: '2026-12-01T11:00:00Z',
      purpose: 'Microscopy',
      teamName: null,
      status: 'pending' as const,
      reviewedBy: null,
      createdAt: '2026-11-20T10:00:00Z',
      updatedAt: '2026-11-20T10:00:00Z',
    };
    vi.mocked(reservationService.listReservations).mockResolvedValue([
      pendingReservation,
    ]);
    vi.mocked(reservationService.reviewReservation).mockResolvedValue({
      ...pendingReservation,
      status: 'confirmed',
    });

    renderAs('manager');
    fireEvent.click(
      within(
        screen.getByRole('navigation', { name: 'Navigare principală' }),
      ).getByRole('button', { name: 'Rezervările mele' }),
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Confirmă' }));

    expect(reservationService.reviewReservation).toHaveBeenCalledWith(
      'reservation-1',
      'confirmed',
    );
    expect(await screen.findByText('confirmed')).toBeInTheDocument();
  });

  it('shows API errors when a manager cannot confirm a reservation', async () => {
    vi.mocked(reservationService.listReservations).mockResolvedValue([
      {
        id: 'reservation-2',
        userId: user.id,
        resourceId: 'resource-1',
        startsAt: '2026-12-01T10:00:00Z',
        endsAt: '2026-12-01T11:00:00Z',
        purpose: 'Microscopy',
        teamName: null,
        status: 'pending',
        reviewedBy: null,
        createdAt: '2026-11-20T10:00:00Z',
        updatedAt: '2026-11-20T10:00:00Z',
      },
    ]);
    vi.mocked(reservationService.reviewReservation).mockRejectedValue(
      new Error('You are not allowed to approve this reservation.'),
    );

    renderAs('manager');
    fireEvent.click(
      within(
        screen.getByRole('navigation', { name: 'Navigare principală' }),
      ).getByRole('button', { name: 'Rezervările mele' }),
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Confirmă' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'You are not allowed to approve this reservation.',
    );
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

  it('creates an account and immediately signs into the new account', async () => {
    let authenticate: (account: AuthUser) => void = () => undefined;
    const register = vi.fn(async () => authenticate(user));
    vi.mocked(useAuth).mockImplementation(() => {
      const [authenticatedUser, setAuthenticatedUser] =
        useState<AuthUser | null>(null);
      authenticate = setAuthenticatedUser;
      return {
        user: authenticatedUser,
        isLoading: false,
        error: null,
        login: vi.fn(),
        register,
        logout: vi.fn(),
      };
    });
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Înregistrează-te' }));
    fireEvent.change(screen.getByLabelText('Nume complet'), {
      target: { value: 'Andrei Ionescu' },
    });
    fireEvent.change(screen.getByLabelText('Adresă de e-mail'), {
      target: { value: 'andrei@example.edu' },
    });
    fireEvent.change(screen.getByLabelText('Parolă'), {
      target: { value: 'parola-sigura-123' },
    });
    fireEvent.change(screen.getByLabelText('Confirmă parola'), {
      target: { value: 'parola-sigura-123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Creează contul' }));

    expect(register).toHaveBeenCalledWith(
      'Andrei Ionescu',
      'andrei@example.edu',
      'parola-sigura-123',
    );
    expect(await screen.findByText('Andrei Ionescu')).toBeInTheDocument();
  });

  it('does not send registration when passwords do not match', async () => {
    const register = vi.fn().mockResolvedValue(undefined);
    renderUnauthenticated(register);

    fireEvent.click(screen.getByRole('button', { name: 'Înregistrează-te' }));
    fireEvent.change(screen.getByLabelText('Nume complet'), {
      target: { value: 'Andrei Ionescu' },
    });
    fireEvent.change(screen.getByLabelText('Adresă de e-mail'), {
      target: { value: 'andrei@example.edu' },
    });
    fireEvent.change(screen.getByLabelText('Parolă'), {
      target: { value: 'parola-sigura-123' },
    });
    fireEvent.change(screen.getByLabelText('Confirmă parola'), {
      target: { value: 'alta-parola-123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Creează contul' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Parolele nu coincid.',
    );
    expect(register).not.toHaveBeenCalled();
  });
});
