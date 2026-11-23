import { apiClient } from './apiClient';
import type { Notification } from '../types/resource';

export async function listNotifications() {
  const response = await apiClient.get<Notification[]>('/notifications');
  return response.data;
}

export async function markNotificationRead(id: string) {
  await apiClient.patch(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead() {
  await apiClient.post('/notifications/read-all');
}
