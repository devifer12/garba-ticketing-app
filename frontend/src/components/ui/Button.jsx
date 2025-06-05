import { motion } from 'framer-motion';

const PrimaryButton = ({ children, onClick, className = "", ...props }) => {
  return (
    <motion.button
      className={`bg-gradient-to-r from-navratri-orange to-navratri-yellow text-slate-900 px-8 py-4 rounded-full text-xl font-bold shadow-xl border border-navratri-orange/20 ${className}`}
      whileHover={{
        scale: 1.02,
        boxShadow: "0 20px 40px rgba(255,165,0,0.3)",
        y: -2,
      }}
      whileTap={{ scale: 0.98 }}
      animate={{
        boxShadow: [
          "0 10px 30px rgba(255,165,0,0.2)",
          "0 15px 35px rgba(255,215,0,0.25)",
          "0 10px 30px rgba(255,165,0,0.2)",
        ],
      }}
      transition={{ duration: 2, repeat: Infinity }}
      onClick={onClick}
      {...props}
    >
      {children}
    </motion.button>
  );
};

const SecondaryButton = ({ children, onClick, className = "", ...props }) => {
  return (
    <motion.button
      className={`bg-slate-800/50 backdrop-blur-xl text-white px-6 py-3 rounded-full font-semibold border border-slate-600/50 hover:border-slate-500/50 transition-all duration-300 ${className}`}
      whileHover={{
        scale: 1.02,
        backgroundColor: "rgba(51, 65, 85, 0.7)",
        y: -1,
      }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      {...props}
    >
      {children}
    </motion.button>
  );
};

export { PrimaryButton, SecondaryButton };