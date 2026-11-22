import { useState } from 'react';

import axios from 'axios';

import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  ThemeProvider,
} from '@mui/material';

import { Controller, useForm } from 'react-hook-form';

import { useResourceList } from '../hooks/useResourceList';

import { getApiErrorMessage } from '../services/apiError';

import {
  archiveResource,
  createResource,
  restoreResource,
  updateResource,
} from '../services/resourceService';

import { resourceTheme } from '../theme/resourceTheme';

import './ResourceManagement.css';

import type {
  ApiErrorResponse,
  Resource,
  ResourceInput,
  ResourceState,
  ResourceType,
} from '../types/resource';

type ResourceFormValues = {
  name: string;

  type: ResourceType | '';

  description: string;

  location: string;

  state: ResourceState;

  specifications: string;

  managerId: string;
};

const RESOURCE_TYPES: { value: ResourceType; label: string }[] = [
  { value: 'equipment', label: 'Echipamente' },

  { value: 'robot', label: 'Robotică' },

  { value: 'cluster', label: 'Calcul performant' },

  { value: 'laboratory', label: 'Laboratoare' },

  { value: 'room', label: 'Săli' },
];

const RESOURCE_STATES: { value: ResourceState; label: string }[] = [
  { value: 'available', label: 'Disponibilă' },

  { value: 'unavailable', label: 'Indisponibilă' },

  { value: 'maintenance', label: 'În mentenanță' },
];

const EMPTY_FORM: ResourceFormValues = {
  name: '',

  type: '',

  description: '',

  location: '',

  state: 'available',

  specifications: '{}',

  managerId: '',
};

/** Renders the manager/admin create, edit, list, and archive controls. */
export default function ResourceManagement() {
  const [page, setPage] = useState(1);
  const [showArchived, setShowArchived] = useState(false);

  const { resources, pagination, loading, error, refresh } = useResourceList(
    {
      page,

      pageSize: 100,
    },
    showArchived,
  );

  const [dialogOpen, setDialogOpen] = useState(false);

  const [selectedResource, setSelectedResource] = useState<Resource | null>(
    null,
  );

  const [archiveCandidate, setArchiveCandidate] = useState<Resource | null>(
    null,
  );

  const [actionError, setActionError] = useState<string | null>(null);

  const [notice, setNotice] = useState<string | null>(null);

  const [isArchiving, setIsArchiving] = useState(false);
  const [restoringResourceId, setRestoringResourceId] = useState<string | null>(
    null,
  );

  const {
    register,

    control,

    handleSubmit,

    reset,

    setError,

    formState: { errors, isSubmitting },
  } = useForm<ResourceFormValues>({ defaultValues: EMPTY_FORM });

  function handleCreate() {
    setSelectedResource(null);

    setActionError(null);

    reset(EMPTY_FORM);

    setDialogOpen(true);
  }

  function handleEdit(resource: Resource) {
    setSelectedResource(resource);

    setActionError(null);

    reset({
      name: resource.name,

      type: resource.type,

      description: resource.description,

      location: resource.location,

      state: resource.state,

      specifications: JSON.stringify(resource.specifications, null, 2),

      managerId: resource.managerId ?? '',
    });

    setDialogOpen(true);
  }

  async function handleSave(values: ResourceFormValues) {
    let specifications: Record<string, unknown>;

    try {
      const parsed: unknown = JSON.parse(values.specifications || '{}');

      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('Specifications must be a JSON object.');
      }

      specifications = parsed as Record<string, unknown>;
    } catch {
      setError('specifications', {
        type: 'manual',

        message: 'Introdu un obiect JSON valid.',
      });

      return;
    }

    const input: ResourceInput = {
      name: values.name.trim(),

      type: values.type as ResourceType,

      description: values.description.trim(),

      location: values.location.trim(),
      state: values.state,
      specifications,
      managerId: values.managerId.trim() || null,
    };

    setActionError(null);

    try {
      if (selectedResource) {
        await updateResource(selectedResource.id, input);

        setNotice('Resursa a fost actualizată.');
      } else {
        await createResource(input);

        setNotice('Resursa a fost adăugată.');
      }

      setDialogOpen(false);

      refresh();
    } catch (requestError: unknown) {
      const details = axios.isAxiosError<ApiErrorResponse>(requestError)
        ? requestError.response?.data.details
        : undefined;

      if (details?.length) {
        const fields: Record<string, keyof ResourceFormValues> = {
          name: 'name',

          type: 'type',

          description: 'description',

          location: 'location',

          state: 'state',

          specifications: 'specifications',

          managerId: 'managerId',
        };

        details.forEach(({ field, message }) => {
          const formField = fields[field];

          if (formField) {
            setError(formField, { type: 'server', message });
          }
        });

        setActionError('Verifică valorile indicate în formular.');
      } else {
        setActionError(
          getApiErrorMessage(
            requestError,

            'Nu am putut salva resursa. Încearcă din nou.',
          ),
        );
      }
    }
  }

  async function handleArchive() {
    if (!archiveCandidate) {
      return;
    }

    setIsArchiving(true);

    setActionError(null);

    try {
      await archiveResource(archiveCandidate.id);

      setNotice('Resursa a fost arhivată.');

      setArchiveCandidate(null);

      refresh();
    } catch (requestError: unknown) {
      setActionError(
        getApiErrorMessage(
          requestError,

          'Nu am putut arhiva resursa. Încearcă din nou.',
        ),
      );

      setArchiveCandidate(null);
    } finally {
      setIsArchiving(false);
    }
  }

  async function handleRestore(resource: Resource) {
    setRestoringResourceId(resource.id);
    setActionError(null);

    try {
      await restoreResource(resource.id);
      setNotice('Resursa a fost restaurată și este din nou activă.');
      refresh();
    } catch (requestError: unknown) {
      setActionError(
        getApiErrorMessage(
          requestError,
          'Nu am putut restaura resursa. Încearcă din nou.',
        ),
      );
    } finally {
      setRestoringResourceId(null);
    }
  }

  return (
    <ThemeProvider theme={resourceTheme}>
      <section className="resource-management panel">
        <div className="panel-head">
          <div>
            <h2>
              {showArchived ? 'Resurse arhivate' : 'Gestionarea resurselor'}
            </h2>
            <p>
              {pagination.totalItems}{' '}
              {showArchived ? 'resurse arhivate' : 'resurse active'}
            </p>
          </div>
          <div className="resource-management-actions">
            <Button
              variant={showArchived ? 'outlined' : 'contained'}
              onClick={() => {
                setShowArchived(false);
                setPage(1);
                setActionError(null);
              }}
            >
              Resurse active
            </Button>
            <Button
              variant={showArchived ? 'contained' : 'outlined'}
              onClick={() => {
                setShowArchived(true);
                setPage(1);
                setActionError(null);
              }}
            >
              Arhivate
            </Button>
            {!showArchived && (
              <Button variant="contained" onClick={handleCreate}>
                Adaugă resursă
              </Button>
            )}
          </div>
        </div>

        {notice && (
          <Alert severity="success" onClose={() => setNotice(null)}>
            {notice}
          </Alert>
        )}
        {actionError && (
          <Alert severity="error" onClose={() => setActionError(null)}>
            {actionError}
          </Alert>
        )}
        {error && <Alert severity="error">{error}</Alert>}
        {loading ? (
          <div className="resource-loading" role="status">
            <CircularProgress size={26} />
            <span>Se încarcă resursele...</span>
          </div>
        ) : resources.length === 0 ? (
          <div className="resource-empty">
            <p>
              {showArchived
                ? 'Nu există resurse arhivate.'
                : 'Nu există resurse active.'}
            </p>
            {!showArchived && (
              <Button onClick={handleCreate}>Adaugă prima resursă</Button>
            )}
          </div>
        ) : (
          <div className="resource-management-list">
            {resources.map((resource) => (
              <article className="resource-management-row" key={resource.id}>
                <div>
                  <strong>{resource.name}</strong>
                  <span>
                    {RESOURCE_TYPES.find(({ value }) => value === resource.type)
                      ?.label ?? resource.type}
                    {' · '}
                    {resource.location}
                  </span>
                </div>
                <div className="resource-management-actions">
                  {showArchived ? (
                    <Button
                      onClick={() => handleRestore(resource)}
                      disabled={restoringResourceId !== null}
                    >
                      {restoringResourceId === resource.id
                        ? 'Se restaurează...'
                        : 'Restaurează'}
                    </Button>
                  ) : (
                    <>
                      <Button onClick={() => handleEdit(resource)}>
                        Editează
                      </Button>
                      <Button
                        color="error"
                        onClick={() => setArchiveCandidate(resource)}
                      >
                        Arhivează
                      </Button>
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
        {pagination.totalPages > 1 && (
          <div className="resource-pagination">
            <Button
              disabled={loading || page <= 1}
              onClick={() => setPage((current) => current - 1)}
            >
              Înapoi
            </Button>
            <span>
              Pagina {pagination.page} din {pagination.totalPages}
            </span>
            <Button
              disabled={loading || page >= pagination.totalPages}
              onClick={() => setPage((current) => current + 1)}
            >
              Înainte
            </Button>
          </div>
        )}
      </section>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <form onSubmit={handleSubmit(handleSave)} noValidate>
          <DialogTitle>
            {selectedResource ? 'Editează resursa' : 'Adaugă resursă'}
          </DialogTitle>
          <DialogContent className="resource-form">
            <TextField
              autoFocus
              label="Nume"
              fullWidth
              required
              error={Boolean(errors.name)}
              helperText={errors.name?.message}
              {...register('name', {
                required: 'Numele este obligatoriu.',

                maxLength: {
                  value: 200,

                  message: 'Numele poate avea maximum 200 de caractere.',
                },

                validate: (value) =>
                  Boolean(value.trim()) || 'Introdu numele resursei.',
              })}
            />
            <Controller
              name="type"
              control={control}
              rules={{ required: 'Selectează categoria.' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Categorie"
                  fullWidth
                  required
                  value={field.value ?? ''}
                  error={Boolean(errors.type)}
                  helperText={errors.type?.message}
                >
                  {RESOURCE_TYPES.map(({ value, label }) => (
                    <MenuItem key={value} value={value}>
                      {label}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
            <TextField
              label="Locație"
              fullWidth
              required
              error={Boolean(errors.location)}
              helperText={errors.location?.message}
              {...register('location', {
                required: 'Locația este obligatorie.',

                maxLength: {
                  value: 300,

                  message: 'Locația poate avea maximum 300 de caractere.',
                },

                validate: (value) =>
                  Boolean(value.trim()) || 'Introdu locația resursei.',
              })}
            />
            <TextField
              label="Descriere"
              fullWidth
              multiline
              minRows={2}
              {...register('description')}
            />
            <Controller
              name="state"
              control={control}
              render={({ field }) => (
                <TextField {...field} select label="Stare" fullWidth>
                  {RESOURCE_STATES.map(({ value, label }) => (
                    <MenuItem key={value} value={value}>
                      {label}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
            <TextField
              label="ID manager responsabil (opțional)"
              fullWidth
              error={Boolean(errors.managerId)}
              helperText={
                errors.managerId?.message ??
                'Introdu UUID-ul unui cont manager sau administrator.'
              }
              {...register('managerId', {
                validate: (value) =>
                  !value.trim() ||
                  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
                    value.trim(),
                  ) ||
                  'Introdu un UUID valid.',
              })}
            />
            <TextField
              label="Specificații (JSON)"
              fullWidth
              multiline
              minRows={3}
              error={Boolean(errors.specifications)}
              helperText={errors.specifications?.message}
              {...register('specifications')}
            />
            {actionError && <Alert severity="error">{actionError}</Alert>}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Renunță</Button>
            <Button type="submit" variant="contained" disabled={isSubmitting}>
              {isSubmitting ? 'Se salvează...' : 'Salvează'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog
        open={Boolean(archiveCandidate)}
        onClose={() => setArchiveCandidate(null)}
      >
        <DialogTitle>Arhivezi resursa?</DialogTitle>
        <DialogContent>
          <p>
            „{archiveCandidate?.name}” nu va mai apărea în catalog.
            Înregistrarea și rezervările existente vor fi păstrate.
          </p>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setArchiveCandidate(null)}>
            Păstrează resursa
          </Button>
          <Button
            color="error"
            variant="contained"
            disabled={isArchiving}
            onClick={handleArchive}
          >
            {isArchiving ? 'Se arhivează...' : 'Arhivează'}
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}
