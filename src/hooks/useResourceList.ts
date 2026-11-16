import { useEffect, useMemo, useState } from 'react';

import type {
  Resource,
  ResourceListResponse,
  ResourceQuery,
} from '../types/resource';

import { getApiErrorMessage } from '../services/apiError';

import {
  listArchivedResources,
  listResources,
} from '../services/resourceService';

const EMPTY_RESULT: ResourceListResponse = {
  data: [],

  pagination: { page: 1, pageSize: 20, totalItems: 0, totalPages: 0 },
};

/** Fetches a cancellable, paginated resource list for a screen. */
export function useResourceList(
  query: ResourceQuery = {},
  archived = false,
  enabled = true,
) {
  const queryKey = JSON.stringify(query);

  const stableQuery = useMemo(
    () => JSON.parse(queryKey) as ResourceQuery,

    [queryKey],
  );

  const [result, setResult] = useState(EMPTY_RESULT);

  const [loading, setLoading] = useState(enabled);

  const [error, setError] = useState<string | null>(null);

  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();

    setLoading(true);

    setError(null);

    (archived ? listArchivedResources : listResources)(
      stableQuery,
      controller.signal,
    )
      .then(setResult)

      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) {
          setError(
            getApiErrorMessage(
              requestError,

              'Nu am putut încărca resursele. Încearcă din nou.',
            ),
          );
        }
      })

      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [archived, enabled, stableQuery, reloadToken]);

  return {
    resources: result.data as Resource[],

    pagination: result.pagination,

    loading,

    error,

    refresh: () => setReloadToken((current) => current + 1),
  };
}
