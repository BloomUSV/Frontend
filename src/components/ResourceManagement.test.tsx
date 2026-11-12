import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import ResourceManagement from './ResourceManagement';

import type { Resource, ResourceListResponse } from '../types/resource';

const resource: Resource = {
  id: '29fe1434-a3ef-43be-a0fc-2ab4b52dd332',

  name: 'Robot de test',

  type: 'robot',

  description: 'Descriere',

  location: 'Corp D',

  state: 'available',

  specifications: { axes: 6 },

  managerId: null,

  isActive: true,

  createdAt: '2025-01-10T09:00:00Z',

  updatedAt: '2025-05-01T10:30:00Z',
};

const response: ResourceListResponse = {
  data: [resource],

  pagination: { page: 1, pageSize: 100, totalItems: 1, totalPages: 1 },
};

const archivedResource: Resource = { ...resource, isActive: false };

const archivedResponse: ResourceListResponse = {
  data: [archivedResource],
  pagination: { page: 1, pageSize: 100, totalItems: 1, totalPages: 1 },
};

const {
  archiveResource,
  createResource,
  listArchivedResources,
  listResources,
  restoreResource,
  updateResource,
} = vi.hoisted(() => ({
  archiveResource: vi.fn(),

  createResource: vi.fn(),

  listArchivedResources: vi.fn(),

  listResources: vi.fn(),

  restoreResource: vi.fn(),

  updateResource: vi.fn(),
}));

vi.mock('../services/resourceService', () => ({
  archiveResource,

  createResource,

  listArchivedResources,

  listResources,

  restoreResource,

  updateResource,
}));

describe('ResourceManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    listResources.mockResolvedValue(response);
    listArchivedResources.mockResolvedValue(archivedResponse);
  });

  it('displays resources returned by the API', async () => {
    render(<ResourceManagement />);

    expect(await screen.findByText('Robot de test')).toBeInTheDocument();

    expect(screen.getByText('1 resurse active')).toBeInTheDocument();
  });

  it('submits a validated new resource and refreshes the list', async () => {
    createResource.mockResolvedValue(resource);

    render(<ResourceManagement />);

    fireEvent.click(
      await screen.findByRole('button', { name: 'Adaugă resursă' }),
    );

    fireEvent.change(screen.getByRole('textbox', { name: /Nume/ }), {
      target: { value: 'Resursă nouă' },
    });

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Categorie' }));
    fireEvent.click(await screen.findByRole('option', { name: 'Echipamente' }));

    fireEvent.change(screen.getByRole('textbox', { name: /Locație/ }), {
      target: { value: 'Corp A' },
    });
    fireEvent.change(
      screen.getByRole('textbox', {
        name: 'ID manager responsabil (opțional)',
      }),
      {
        target: { value: 'd1b3efc4-48f4-4ec1-9af0-47eccb939600' },
      },
    );

    fireEvent.click(screen.getByRole('button', { name: 'Salvează' }));

    await waitFor(() => {
      expect(createResource).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Resursă nouă',

          type: 'equipment',

          location: 'Corp A',

          specifications: {},

          managerId: 'd1b3efc4-48f4-4ec1-9af0-47eccb939600',
        }),
      );
    });

    expect(listResources).toHaveBeenCalledTimes(2);
  });

  it('shows an API error rather than hiding a failed request', async () => {
    listResources.mockRejectedValueOnce(new Error('Server indisponibil'));

    render(<ResourceManagement />);

    expect(await screen.findByText('Server indisponibil')).toBeInTheDocument();
  });

  it('updates a selected resource', async () => {
    updateResource.mockResolvedValue(resource);

    render(<ResourceManagement />);

    fireEvent.click(await screen.findByRole('button', { name: 'Editează' }));

    fireEvent.change(screen.getByRole('textbox', { name: /Nume/ }), {
      target: { value: 'Robot actualizat' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Salvează' }));

    await waitFor(() => {
      expect(updateResource).toHaveBeenCalledWith(
        resource.id,

        expect.objectContaining({ name: 'Robot actualizat' }),
      );
    });
  });

  it('confirms and archives a selected resource', async () => {
    archiveResource.mockResolvedValue(undefined);

    render(<ResourceManagement />);

    fireEvent.click(await screen.findByRole('button', { name: 'Arhivează' }));

    const confirmation = screen.getByRole('dialog');

    fireEvent.click(
      within(confirmation).getByRole('button', { name: 'Arhivează' }),
    );

    await waitFor(() => {
      expect(archiveResource).toHaveBeenCalledWith(resource.id);
    });
  });

  it('lists archived resources and restores a selected resource', async () => {
    restoreResource.mockResolvedValue(resource);

    render(<ResourceManagement />);

    fireEvent.click(await screen.findByRole('button', { name: 'Arhivate' }));

    expect(await screen.findByText('1 resurse arhivate')).toBeInTheDocument();
    expect(await screen.findByText('Robot de test')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Restaurează' }));

    await waitFor(() => {
      expect(restoreResource).toHaveBeenCalledWith(resource.id);
      expect(listArchivedResources).toHaveBeenCalledTimes(2);
    });
    expect(
      await screen.findByText(
        'Resursa a fost restaurată și este din nou activă.',
      ),
    ).toBeInTheDocument();
  });
});
