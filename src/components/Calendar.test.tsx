import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import Calendar from './Calendar';
import * as calendarService from '../services/calendarService';
import type { Resource } from '../types/resource';

vi.mock('../services/calendarService', () => ({
  getCalendarEvents: vi.fn(),
}));

const resource: Resource = {
  id: 'd1b3efc4-48f4-4ec1-9af0-47eccb939600',
  name: 'Microscop de cercetare',
  type: 'equipment',
  description: '',
  location: 'Laboratorul 1',
  state: 'available',
  specifications: {},
  managerId: null,
  isActive: true,
  createdAt: '2025-01-15T10:00:00Z',
  updatedAt: '2025-01-15T10:00:00Z',
};

function renderCalendar(
  resources: Resource[],
  resourcesLoading = false,
  resourcesError: string | null = null,
) {
  return render(
    <Calendar
      resources={resources}
      resourcesLoading={resourcesLoading}
      resourcesError={resourcesError}
      onBook={vi.fn()}
      userRole="user"
    />,
  );
}

describe('resource availability calendar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(calendarService.getCalendarEvents).mockResolvedValue([]);
  });

  it('lists resources and loads calendar events for the selected resource', async () => {
    renderCalendar([resource]);

    const selector = screen.getByRole('combobox', { name: 'Resursă' });
    expect(
      screen.getByRole('option', { name: 'Microscop de cercetare' }),
    ).toBeInTheDocument();

    fireEvent.change(selector, { target: { value: resource.id } });

    await waitFor(() => {
      expect(calendarService.getCalendarEvents).toHaveBeenCalledWith(
        expect.objectContaining({ resourceId: resource.id }),
        expect.any(AbortSignal),
      );
    });
  });

  it('explains empty and loading resource states in the selector', () => {
    const { rerender } = renderCalendar([], true);
    const selector = screen.getByRole('combobox', { name: 'Resursă' });

    expect(selector).toBeDisabled();
    expect(
      screen.getByRole('option', { name: 'Se încarcă resursele...' }),
    ).toBeInTheDocument();

    rerender(
      <Calendar
        resources={[]}
        resourcesLoading={false}
        resourcesError={null}
        onBook={vi.fn()}
        userRole="user"
      />,
    );

    expect(
      screen.getByRole('option', { name: 'Nu există resurse disponibile' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Nu există resurse disponibile în catalog.'),
    ).toBeInTheDocument();
  });
});
