import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

const LazyImage = ({ 
  src, 
  alt, 
  className = '', 
  placeholder = null,
  fallback = null,
  aspectRatio = '1/1', // Add aspect ratio prop
  priority = false, // Add priority loading
  ...props 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority); // Load immediately if priority
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (priority) return; // Skip intersection observer for priority images

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  // Calculate padding-bottom for aspect ratio
  const getPaddingBottom = () => {
    if (aspectRatio === '16/9') return '56.25%';
    if (aspectRatio === '4/3') return '75%';
    if (aspectRatio === '1/1') return '100%';
    if (aspectRatio === '3/2') return '66.67%';
    
    // Custom aspect ratio (e.g., "16/9")
    if (aspectRatio.includes('/')) {
      const [width, height] = aspectRatio.split('/').map(Number);
      return `${(height / width) * 100}%`;
    }
    
    return '75%'; // Default 4:3
  };

  return (
    <div 
      ref={containerRef} 
      className={`relative overflow-hidden ${className}`} 
      style={{ paddingBottom: getPaddingBottom() }}
      {...props}
    >
      {/* Placeholder with shimmer effect */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-slate-700/50 flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-700/50 via-slate-600/50 to-slate-700/50 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]" />
          {placeholder || (
            <div className="relative z-10 text-slate-400 text-sm">Loading...</div>
          )}
        </div>
      )}

      {/* Image */}
      {isInView && (
        <motion.img
          ref={imgRef}
          src={hasError ? fallback : src}
          alt={alt}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={handleLoad}
          onError={handleError}
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoaded ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
        />
      )}

      {/* Error state */}
      {hasError && !fallback && (
        <div className="absolute inset-0 bg-slate-700/50 flex items-center justify-center">
          <div className="text-slate-400 text-sm text-center">
            <div className="text-2xl mb-2">🖼️</div>
            <div>Image not available</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LazyImage;
