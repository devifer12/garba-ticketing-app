import React from 'react';
import { motion } from 'framer-motion';

const AboutSection = ({ event }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8 },
    },
  };

  return (
    <section className="py-12 sm:py-20 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-4 sm:left-10 w-24 sm:w-32 h-24 sm:h-32 border border-navratri-orange/10 rounded-full"></div>
        <div className="absolute bottom-20 right-4 sm:right-10 w-32 sm:w-40 h-32 sm:h-40 border border-navratri-pink/10 rounded-full"></div>
        <div className="absolute top-1/2 left-1/4 w-16 sm:w-20 h-16 sm:h-20 bg-navratri-yellow/5 rounded-full blur-xl"></div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        className="container mx-auto px-4 relative z-10"
      >
        <div className="flex flex-col items-center max-w-6xl mx-auto">
          {/* Section Title */}
          <motion.div
            variants={itemVariants}
            className="text-center mb-8 sm:mb-12"
          >
            <motion.h2 
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold font-serif bg-gradient-to-r from-navratri-orange via-navratri-yellow to-navratri-pink bg-clip-text text-transparent mb-4 sm:mb-6 px-4"
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                repeatType: "loop",
              }}
              style={{
                backgroundSize: "200% 200%",
              }}
            >
              ABOUT THE EVENT
            </motion.h2>
            
            {/* Decorative line */}
            <motion.div 
              className="w-16 sm:w-24 h-1 bg-gradient-to-r from-navratri-orange to-navratri-yellow rounded-full mx-auto"
              animate={{
                scaleX: [1, 1.2, 1],
                opacity: [0.7, 1, 0.7],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
            />
          </motion.div>

          {/* Content */}
          <motion.div
            variants={itemVariants}
            className="relative"
          >
            {/* Background glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-navratri-orange/5 via-transparent to-navratri-pink/5 rounded-3xl blur-3xl"></div>
            
            <div className="relative bg-slate-800/30 backdrop-blur-xl rounded-3xl p-6 sm:p-8 md:p-12 border border-slate-700/30">
              {/* Event Description */}
              <motion.div 
                className="text-base sm:text-lg md:text-xl text-slate-300 leading-relaxed text-center mb-6 sm:mb-8"
                variants={itemVariants}
              >
                {event?.aboutText ? (
                  <p className="mb-4 sm:mb-6">{event.aboutText}</p>
                ) : (
                  <>
                    <p className="mb-4 sm:mb-6">
                      Experience the spirit of <span className="text-navratri-orange font-semibold">Navratri</span> come alive in all its glory—vibrant colors, electrifying energy, and the timeless rhythm of <span className="text-navratri-yellow font-semibold">Garba</span>. This celebration is more than just an event; it's a chance to immerse yourself in the magic of tradition, music, and dance before the official festivities begin.
                    </p>
                    
                    <p>
                      Feel the joy, the unity, and the cultural richness as we come together to welcome Navratri in the most exhilarating way possible. Join us for an unforgettable night of <span className="text-navratri-pink font-semibold">celebration</span>, <span className="text-navratri-green font-semibold">community</span>, and <span className="text-navratri-blue font-semibold">culture</span>.
                    </p>
                  </>
                )}
              </motion.div>

              {/* Event Highlights - Only show if event data is available */}
              {event && (
                <motion.div
                  variants={itemVariants}
                  className="grid grid-cols-1 mb-6 sm:mb-8"
                >
                  <div className="bg-slate-700/50 grid items-center justify-center rounded-xl p-4 sm:p-6">
                    <div className="text-center justify-center text-2xl sm:text-3xl mb-3">🎭</div>
                    <h3 className="text-white font-bold text-lg mb-2 text-center">Cultural Experience</h3>
                    <div className="space-y-2 text-slate-300 text-sm sm:text-base">
                      <p><span className="text-navratri-orange">Traditional:</span> Authentic Garba & Dandiya</p>
                      <p><span className="text-navratri-yellow">Music:</span> Live DJ & Folk Songs</p>
                      <p><span className="text-navratri-pink">Dance:</span> Competitions & Prizes</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Decorative elements */}
              <div className="flex justify-center mt-6 sm:mt-8 space-x-3 sm:space-x-4">
                {['🎭', '💃', '🎵', '🎉'].map((emoji, index) => (
                  <motion.div
                    key={index}
                    className="text-2xl sm:text-3xl"
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: [0, 10, -10, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: index * 0.3,
                    }}
                  >
                    {emoji}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Call to action */}
          <motion.div
            variants={itemVariants}
            className="mt-8 sm:mt-12 text-center px-4"
          >
            <motion.p 
              className="text-navratri-yellow font-bold text-lg sm:text-xl"
              animate={{
                opacity: [0.8, 1, 0.8],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
            >
              ✨ Get ready to dance the night away! ✨
            </motion.p>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

export default AboutSection;