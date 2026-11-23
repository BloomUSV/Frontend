import { apiClient } from './apiClient';
import type { WaitlistEntry } from '../types/resource';

export async function listWaitlist() {
  const response = await apiClient.get<WaitlistEntry[]>('/waitlist');
  return response.data;
}

export async function createWaitlistEntry(input: {
  resourceId: string;
  desiredStart: string;
  desiredEnd: string;
  requirements?: Record<string, unknown>;
}) {
  const response = await apiClient.post<WaitlistEntry>('/waitlist', input);
  return response.data;
}

export async function removeWaitlistEntry(id: string) {
  await apiClient.delete(`/waitlist/${id}`);
}
