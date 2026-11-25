import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as authService from '../services/authService';
import type { AuthUser } from '../types/resource';
import { AuthProvider, useAuth } from './AuthContext';

vi.mock('../services/authService', () => ({
  getCurrentUser: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
}));

const registeredUser: AuthUser = {
  id: 'd1b3efc4-48f4-4ec1-9af0-47eccb939600',
  fullName: 'Andrei Ionescu',
  email: 'andrei@example.edu',
  role: 'user',
  isActive: true,
  createdAt: '2025-01-15T10:00:00Z',
  updatedAt: '2025-01-15T10:00:00Z',
};

describe('AuthProvider registration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authService.getCurrentUser).mockRejectedValue(
      new Error('No current session'),
    );
    vi.mocked(authService.register).mockResolvedValue({
      user: registeredUser,
    });
    vi.mocked(authService.login).mockResolvedValue({
      user: registeredUser,
    });
  });

  it('authenticates the newly registered user immediately', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.register(
        'Andrei Ionescu',
        'andrei@example.edu',
        'parola-sigura-123',
      );
    });

    expect(authService.register).toHaveBeenCalledWith(
      'Andrei Ionescu',
      'andrei@example.edu',
      'parola-sigura-123',
    );
    expect(authService.login).toHaveBeenCalledWith(
      'andrei@example.edu',
      'parola-sigura-123',
    );
    expect(result.current.user).toEqual(registeredUser);
  });
});
