import { useState, useCallback, useRef } from "react";
import { toast } from "react-toastify";
import { apiUtils } from "../services/api";

// Simple in-memory cache for API responses
const apiCache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes - increased cache duration

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const execute = useCallback(async (apiCall, options = {}) => {
    const {
      showLoading = true,
      showError = true,
      showSuccess = false,
      successMessage = "Operation completed successfully",
      cacheKey = null,
      cacheDuration = CACHE_DURATION,
      suppressErrorIfSuccessful = false,
    } = options;

    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      // Check cache first
      if (cacheKey) {
        const cached = apiCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < cacheDuration) {
          if (showLoading) setLoading(false); // Ensure loading is false for cached results
          return cached.data;
        }
      }

      if (showLoading) setLoading(true);
      setError(null);

      const result = await apiCall(abortControllerRef.current.signal);

      // Cache successful results
      if (cacheKey && result) {
        apiCache.set(cacheKey, {
          data: result,
          timestamp: Date.now(),
        });

        // Clean up old cache entries
        if (apiCache.size > 100) { // Increased cache size
          const oldestKey = apiCache.keys().next().value;
          apiCache.delete(oldestKey);
        }
      }

      if (showSuccess) {
        toast.success(successMessage);
      }

      return result;
    } catch (err) {
      // Don't show error if request was aborted
      if (err.name === "AbortError") {
        return;
      }

      const errorMessage = apiUtils.formatErrorMessage(err);
      setError(errorMessage);

      // Only show error if not suppressed and operation actually failed
      if (showError && !suppressErrorIfSuccessful) {
        toast.error(errorMessage);
      }

      throw err;
    } finally {
      if (showLoading) setLoading(false);
      abortControllerRef.current = null;
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const clearCache = useCallback((key) => {
    if (key) {
      apiCache.delete(key);
    } else {
      apiCache.clear();
    }
  }, []);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return { loading, error, execute, clearError, clearCache, cleanup };
};