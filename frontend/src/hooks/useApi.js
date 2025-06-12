import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { apiUtils } from '../services/api';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (apiCall, options = {}) => {
    const { 
      showLoading = true, 
      showError = true, 
      showSuccess = false,
      successMessage = 'Operation completed successfully'
    } = options;

    try {
      if (showLoading) setLoading(true);
      setError(null);
      
      const result = await apiCall();
      
      if (showSuccess) {
        toast.success(successMessage);
      }
      
      return result;
    } catch (err) {
      const errorMessage = apiUtils.formatErrorMessage(err);
      setError(errorMessage);
      
      if (showError) {
        toast.error(errorMessage);
      }
      
      throw err;
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { loading, error, execute, clearError };
};