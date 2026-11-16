import { apiClient } from './apiClient';
import type { CalendarEvent } from '../types/resource';

export type CalendarEventsParams = {
  start: string;

  end: string;

  resourceId?: string;

  status?: string;
};

export async function getCalendarEvents(
  params: CalendarEventsParams,
  signal?: AbortSignal,
) {
  const response = await apiClient.get<CalendarEvent[]>('/calendar/events', {
    params,
    signal,
  });

  return response.data;
}