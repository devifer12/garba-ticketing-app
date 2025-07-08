import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const Preloader = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const text = "HYYEVENTS PRESENTS";
  const words = text.split(" ");

  useEffect(() => {
    const timer = setTimeout(
      () => {
        if (currentStep < words.length) {
          setCurrentStep(currentStep + 1);
        } else {
          // Wait a bit after all words are shown, then complete
          setTimeout(() => {
            setIsComplete(true);
            setTimeout(() => {
              onComplete();
            }, 800);
          }, 1000);
        }
      },
      currentStep === 0 ? 500 : 800,
    );

    return () => clearTimeout(timer);
  }, [currentStep, words.length, onComplete]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
    exit: {
      opacity: 0,
      scale: 1.1,
      transition: {
        duration: 0.8,
        ease: "easeInOut",
      },
    },
  };

  const wordVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      filter: "blur(20px)",
    },
    visible: {
      opacity: 1,
      scale: 1,
      filter: "blur(0px)",
      transition: {
        duration: 0.8,
        ease: "easeOut",
      },
    },
  };

  const cornerVariants = {
    hidden: {
      opacity: 0,
      scale: 0.5,
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        delay: 0.2,
      },
    },
  };

  return (
    <AnimatePresence>
      {!isComplete && (
        <motion.div
          className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Animated background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-black to-slate-800 opacity-90" />

          {/* Text container */}
          <div className="relative z-10 text-center">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
              {words.map((word, index) => (
                <motion.div
                  key={index}
                  className="relative"
                  variants={wordVariants}
                  initial="hidden"
                  animate={index < currentStep ? "visible" : "hidden"}
                >
                  <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white font-serif tracking-wider">
                    {word === "HYYEVENTS" ? (
                      <span className="bg-gradient-to-r from-navratri-orange via-navratri-yellow to-navratri-pink bg-clip-text text-transparent">
                        {word}
                      </span>
                    ) : (
                      <span className="text-white">{word}</span>
                    )}
                  </h1>

                  {/* Glow effect */}
                  {index < currentStep && (
                    <div className="absolute inset-0 text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold font-serif tracking-wider opacity-30 blur-sm">
                      {word === "HYYEVENTS" ? (
                        <span className="bg-gradient-to-r from-navratri-orange via-navratri-yellow to-navratri-pink bg-clip-text text-transparent">
                          {word}
                        </span>
                      ) : (
                        <span className="text-white">{word}</span>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Loading indicator */}
            {currentStep === words.length && (
              <motion.div
                className="mt-8 flex justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <div className="flex space-x-2">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 bg-navratri-yellow rounded-full"
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.5, 1, 0.5],
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        delay: i * 0.2,
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Preloader;