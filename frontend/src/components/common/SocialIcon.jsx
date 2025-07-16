import React, { lazy, Suspense } from 'react';
import { motion } from 'framer-motion';

// Lazy load FontAwesome components
const FontAwesomeIcon = lazy(() => import('@fortawesome/react-fontawesome').then(module => ({
  default: module.FontAwesomeIcon
})));

const SocialIcon = ({ icon, color, url, name }) => {
  return (
    <motion.a
      href={url}
      className="w-10 h-10 bg-slate-800/50 backdrop-blur-xl rounded-full flex items-center justify-center text-lg hover:bg-navratri-orange/20 hover:text-navratri-orange transition-all border border-slate-700/30"
      whileHover={{ scale: 1.1, y: -2 }}
      whileTap={{ scale: 0.95 }}
      title={name}
    >
      <Suspense fallback={<div className="w-4 h-4 animate-pulse bg-slate-600 rounded" />}>
        <FontAwesomeIcon icon={icon} style={{ color }} />
      </Suspense>
    </motion.a>
  );
};

export default SocialIcon;
