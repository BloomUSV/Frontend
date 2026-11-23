import { apiClient } from './apiClient';
import type { Feedback } from '../types/resource';

export async function listFeedback(scope: 'own' | 'all' = 'own') {
  const response = await apiClient.get<Feedback[]>('/feedback', {
    params: { scope },
  });
  return response.data;
}

export async function createFeedback(input: {
  resourceId: string;
  rating: number;
  message: string;
}) {
  const response = await apiClient.post<Feedback>('/feedback', input);
  return response.data;
}
