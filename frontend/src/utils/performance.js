  // Performance optimization utilities

  // Debounce function for API calls
  export const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // Throttle function for scroll events
  export const throttle = (func, limit) => {
    let inThrottle;
    return function () {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  };

  // Memoization for expensive calculations
  export const memoize = (fn) => {
    const cache = new Map();
    return (...args) => {
      const key = JSON.stringify(args);
      if (cache.has(key)) {
        return cache.get(key);
      }
      const result = fn(...args);
      cache.set(key, result);
      return result;
    };
  };

  // Intersection Observer for lazy loading
  export const createIntersectionObserver = (callback, options = {}) => {
    const defaultOptions = {
      root: null,
      rootMargin: "50px",
      threshold: 0.1,
      ...options,
    };

    return new IntersectionObserver(callback, defaultOptions);
  };

  // Performance monitoring
  export const measurePerformance = (name, fn) => {
    return async (...args) => {
      const start = performance.now();
      const result = await fn(...args);
      const end = performance.now();

      if (process.env.NODE_ENV === "development") {
        console.log(`${name} took ${end - start} milliseconds`);
      }

      return result;
    };
  };

  // Bundle size analyzer
  export const logBundleSize = () => {
    if (process.env.NODE_ENV === "development" && "performance" in window) {
      window.addEventListener("load", () => {
        const entries = performance.getEntriesByType("navigation");
        if (entries.length > 0) {
          const entry = entries[0];
          console.log("Page Load Performance:", {
            domContentLoaded:
              entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
            loadComplete: entry.loadEventEnd - entry.loadEventStart,
            totalTime: entry.loadEventEnd - entry.fetchStart,
          });
        }
      });
    }
  };

  // Memory usage monitoring
  export const monitorMemoryUsage = () => {
    if (process.env.NODE_ENV === "development" && "memory" in performance) {
      setInterval(() => {
        const memory = performance.memory;
        console.log("Memory Usage:", {
          used: Math.round(memory.usedJSHeapSize / 1048576) + " MB",
          total: Math.round(memory.totalJSHeapSize / 1048576) + " MB",
          limit: Math.round(memory.jsHeapSizeLimit / 1048576) + " MB",
        });
      }, 30000); // Log every 30 seconds
    }
  };