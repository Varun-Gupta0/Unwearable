import { useState, useEffect, useCallback } from 'react';

/**
 * Result object returned by `useSupabaseQuery`.
 */
export interface UseSupabaseQueryResult<T> {
  /** The data returned by the fetch function, or `null` if loading/error. */
  data: T | null;
  /** Any error thrown or returned during the fetch, or `null` if none. */
  error: unknown;
  /** Whether the fetch is currently in progress. */
  loading: boolean;
  /** Call this to manually re-trigger the fetch (e.g., on retry). */
  refetch: () => void;
}

/**
 * A generic React hook that wraps any async data-fetching function with
 * loading, error, and data states. Cancels in-flight requests on unmount.
 *
 * @example
 * ```tsx
 * const { data, error, loading, refetch } = useSupabaseQuery(() =>
 *   supabase.from('orders').select('*').then(({ data, error }) => {
 *     if (error) throw error;
 *     return data;
 *   })
 * );
 * ```
 *
 * @param fetchFn - An async function that returns a `Promise<T>`. It is
 *   **memoized by reference** — wrap it in `useCallback` if you need it to
 *   depend on component state without causing infinite re-fetch loops.
 */
export function useSupabaseQuery<T>(
  fetchFn: () => Promise<T>
): UseSupabaseQueryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  /** Manually re-trigger the fetch. */
  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    fetchFn()
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((e) => {
        if (!cancelled) setError(e);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchFn, tick]);

  return { data, error, loading, refetch };
}
