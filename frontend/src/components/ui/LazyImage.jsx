import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

const LazyImage = ({
  src,
  alt,
  className = "",
  placeholder = null,
  fallback = null,
  aspectRatio = "1/1",
  priority = false,
  responsive = false, // New prop for responsive images
  mobileSrc = null, // Mobile-specific image source
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const imgRef = useRef(null);
  const containerRef = useRef(null);

  // Handle responsive image selection
  useEffect(() => {
    if (responsive && mobileSrc) {
      const handleResize = () => {
        const isMobile = window.innerWidth <= 768;
        setCurrentSrc(isMobile ? mobileSrc : src);
      };

      handleResize(); // Set initial source
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, [src, mobileSrc, responsive]);

  useEffect(() => {
    if (priority) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.05, rootMargin: "100px" }, // Increased rootMargin for earlier loading
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

  const getPaddingBottom = () => {
    if (aspectRatio === "16/9") return "56.25%";
    if (aspectRatio === "4/3") return "75%";
    if (aspectRatio === "1/1") return "100%";
    if (aspectRatio === "3/2") return "66.67%";

    if (aspectRatio.includes("/")) {
      const [width, height] = aspectRatio.split("/").map(Number);
      return `${(height / width) * 100}%`;
    }

    return "75%";
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{ paddingBottom: getPaddingBottom() }}
      {...props}
    >
      {/* Optimized placeholder with reduced animation complexity */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-slate-700/50 flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-700/50 via-slate-600/50 to-slate-700/50 bg-[length:200%_100%] animate-pulse" />
          {placeholder || (
            <div className="relative z-10 text-slate-400 text-sm">
              Loading...
            </div>
          )}
        </div>
      )}

      {/* Optimized image with responsive sources */}
      {isInView && (
        <>
          {responsive && mobileSrc ? (
            <picture>
              <source media="(max-width: 768px)" srcSet={mobileSrc} />
              <source media="(min-width: 769px)" srcSet={src} />
              <motion.img
                ref={imgRef}
                src={hasError ? fallback : currentSrc}
                alt={alt}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                  isLoaded ? "opacity-100" : "opacity-0"
                }`}
                onLoad={handleLoad}
                onError={handleError}
                initial={{ opacity: 0 }}
                animate={{ opacity: isLoaded ? 1 : 0 }}
                transition={{ duration: 0.3 }}
                loading={priority ? "eager" : "lazy"}
                decoding="async"
              />
            </picture>
          ) : (
            <motion.img
              ref={imgRef}
              src={hasError ? fallback : currentSrc}
              alt={alt}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                isLoaded ? "opacity-100" : "opacity-0"
              }`}
              onLoad={handleLoad}
              onError={handleError}
              initial={{ opacity: 0 }}
              animate={{ opacity: isLoaded ? 1 : 0 }}
              transition={{ duration: 0.3 }}
              loading={priority ? "eager" : "lazy"}
              decoding="async"
            />
          )}
        </>
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