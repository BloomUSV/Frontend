import { apiClient } from './apiClient';
import type { AuthUser } from '../types/resource';

export type UserListResponse = {
  data: AuthUser[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
};

export async function listUsers() {
  const response = await apiClient.get<UserListResponse>('/users');
  return response.data.data;
}

export async function updateUser(
  id: string,
  input: { role?: AuthUser['role']; isActive?: boolean },
) {
  const response = await apiClient.patch<AuthUser>(`/users/${id}`, input);
  return response.data;
}
