import React from 'react';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';

const LazySection = ({ children, fallback = null, className = '' }) => {
  const { elementRef, hasIntersected } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '100px'
  });

  return (
    <div ref={elementRef} className={className}>
      {hasIntersected ? children : (fallback || <div style={{ minHeight: '200px' }} />)}
    </div>
  );
};

export default LazySection;