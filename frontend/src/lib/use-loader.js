import { useCallback, useEffect, useMemo, useState } from 'react';

// Fetch-on-mount with explicit status. `reload` keeps current data on screen
// while refetching, so refreshes after a mutation don't flash skeletons.
export function useLoader(load, enabled = true) {
  const [state, setState] = useState({ data: undefined, status: 'loading', error: null });

  const run = useCallback(async () => {
    try {
      const data = await load();
      setState({ data, status: 'ready', error: null });
    } catch (error) {
      setState((s) => ({ ...s, status: 'error', error }));
    }
  }, [load]);

  useEffect(() => {
    if (enabled) run();
  }, [enabled, run]);

  const reload = useCallback(() => {
    setState((s) => (s.data === undefined ? { ...s, status: 'loading', error: null } : s));
    return run();
  }, [run]);

  const setData = useCallback((update) => {
    setState((s) => ({ ...s, data: typeof update === 'function' ? update(s.data) : update }));
  }, []);

  return useMemo(() => ({ ...state, reload, setData }), [state, reload, setData]);
}
