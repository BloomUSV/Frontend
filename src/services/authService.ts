import { apiClient } from './apiClient';
import type { AuthUser, LoginResponse } from '../types/resource';

export async function login(email: string, password: string) {
  const response = await apiClient.post<LoginResponse>('/auth/login', {
    email,
    password,
  });

  return response.data;
}

export async function register(
  fullName: string,
  email: string,
  password: string,
) {
  const response = await apiClient.post<LoginResponse>('/auth/register', {
    fullName,
    email,
    password,
  });

  return response.data;
}

export async function getCurrentUser() {
  const response = await apiClient.get<AuthUser>('/auth/me');
  return response.data;
}

export async function logout() {
  await apiClient.post('/auth/logout');
}
