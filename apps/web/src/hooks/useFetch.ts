import { useCallback, useEffect, useState } from 'react';

export function useFetch<T = unknown>(initialValue?: T) {
  const [config, setConfig] = useState<{
    info: RequestInfo;
    init: RequestInit;
  }>({
    info: '',
    init: {},
  });
  const [data, setData] = useState<T | null>(initialValue ?? null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const _fetch = (
    info: RequestInfo,
    init: RequestInit,
    controller: AbortController
  ) => {
    setLoading(true);
    fetch(info, {
      ...init,
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem('token')}`,
        'Content-Type': 'application/json',
        ...init?.headers,
      },
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then(
        (data) => {
          setData(data);
          setError(false);
        },
        () => {
          setData(null);
          setError(true);
        }
      )
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    const { info, init } = config;
    if (!info) return;

    const abortController = new AbortController();

    _fetch(info, init, abortController);

    return () => {
      abortController.abort();
    };
  }, [config]);

  const execute = useCallback(
    (query: RequestInfo, options: RequestInit = {}) => {
      setConfig({
        info: query,
        init: options,
      });
    },
    []
  );

  return { data, loading, error, execute };
}
