import { apiClient } from './apiClient';
import type { ResourceRule } from '../types/resource';

export async function listRules(resourceId?: string) {
  const response = await apiClient.get<ResourceRule[]>('/rules', {
    params: resourceId ? { resourceId } : undefined,
  });
  return response.data;
}

export async function createRule(input: {
  resourceId: string;
  title: string;
  content: string;
}) {
  const response = await apiClient.post<ResourceRule>('/rules', input);
  return response.data;
}

export async function updateRule(
  id: string,
  input: { title: string; content: string },
) {
  const response = await apiClient.put<ResourceRule>(`/rules/${id}`, input);
  return response.data;
}

export async function deleteRule(id: string) {
  await apiClient.delete(`/rules/${id}`);
}
