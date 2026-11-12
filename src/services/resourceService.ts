import { apiClient } from './apiClient';
import type {
  Resource,
  ResourceInput,
  ResourceListResponse,
  ResourceQuery,
} from '../types/resource';

export async function listResources(
  query: ResourceQuery = {},
  signal?: AbortSignal,
) {
  const response = await apiClient.get<ResourceListResponse>('/resources', {
    params: query,
    signal,
  });

  return response.data;
}

export async function listArchivedResources(
  query: ResourceQuery = {},
  signal?: AbortSignal,
) {
  const response = await apiClient.get<ResourceListResponse>(
    '/resources/archived',
    {
      params: query,
      signal,
    },
  );

  return response.data;
}

export async function getResource(resourceId: string) {
  const response = await apiClient.get<Resource>(`/resources/${resourceId}`);
  return response.data;
}

export async function createResource(input: ResourceInput) {
  const response = await apiClient.post<Resource>('/resources', input);
  return response.data;
}

export async function updateResource(resourceId: string, input: ResourceInput) {
  const response = await apiClient.put<Resource>(
    `/resources/${resourceId}`,
    input,
  );

  return response.data;
}

export async function archiveResource(resourceId: string) {
  await apiClient.delete(`/resources/${resourceId}`);
}

export async function restoreResource(resourceId: string) {
  const response = await apiClient.post<Resource>(
    `/resources/${resourceId}/restore`,
  );
  return response.data;
}
