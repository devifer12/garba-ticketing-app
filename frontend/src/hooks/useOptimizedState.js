import { useState, useCallback, useRef, useEffect } from "react";
import { debounce } from "../utils/performance";

// Optimized state hook that prevents unnecessary re-renders
export const useOptimizedState = (initialState) => {
  const [state, setState] = useState(initialState);
  const stateRef = useRef(state);

  const optimizedSetState = useCallback((newState) => {
    if (typeof newState === "function") {
      setState((prevState) => {
        const nextState = newState(prevState);
        stateRef.current = nextState;
        return nextState;
      });
    } else {
      if (JSON.stringify(newState) !== JSON.stringify(stateRef.current)) {
        setState(newState);
        stateRef.current = newState;
      }
    }
  }, []);

  return [state, optimizedSetState];
};

// Debounced state hook for search inputs
export const useDebouncedState = (initialState, delay = 300) => {
  const [state, setState] = useState(initialState);
  const [debouncedState, setDebouncedState] = useState(initialState);

  const debouncedSetState = useCallback(
    debounce((value) => {
      setDebouncedState(value);
    }, delay),
    [delay],
  );

  useEffect(() => {
    debouncedSetState(state);
  }, [state, debouncedSetState]);

  return [state, setState, debouncedState];
};

// Async state hook with loading and error handling
export const useAsyncState = (initialState = null) => {
  const [state, setState] = useState({
    data: initialState,
    loading: false,
    error: null,
  });

  const setAsyncState = useCallback(async (asyncFunction) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const result = await asyncFunction();
      setState({ data: result, loading: false, error: null });
      return result;
    } catch (error) {
      setState((prev) => ({ ...prev, loading: false, error }));
      throw error;
    }
  }, []);

  const resetState = useCallback(() => {
    setState({ data: initialState, loading: false, error: null });
  }, [initialState]);

  return [state, setAsyncState, resetState];
};