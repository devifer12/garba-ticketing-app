import React from 'react';
import { motion } from 'framer-motion';

const AboutSection = () => {
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
    <section className="py-20 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-32 h-32 border border-navratri-orange/10 rounded-full"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 border border-navratri-pink/10 rounded-full"></div>
        <div className="absolute top-1/2 left-1/4 w-20 h-20 bg-navratri-yellow/5 rounded-full blur-xl"></div>
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
            className="text-center mb-12"
          >
            <motion.h2 
              className="text-4xl md:text-6xl lg:text-7xl font-bold font-serif bg-gradient-to-r from-navratri-orange via-navratri-yellow to-navratri-pink bg-clip-text text-transparent mb-6"
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
              className="w-24 h-1 bg-gradient-to-r from-navratri-orange to-navratri-yellow rounded-full mx-auto"
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
            
            <div className="relative bg-slate-800/30 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-slate-700/30">
              <motion.p 
                className="text-lg md:text-xl text-slate-300 leading-relaxed text-center"
                variants={itemVariants}
              >
                Experience the spirit of <span className="text-navratri-orange font-semibold">Navratri</span> come alive in all its glory—vibrant colors, electrifying energy, and the timeless rhythm of <span className="text-navratri-yellow font-semibold">Garba</span>. This celebration is more than just an event; it's a chance to immerse yourself in the magic of tradition, music, and dance before the official festivities begin.
              </motion.p>
              
              <motion.p 
                className="text-lg md:text-xl text-slate-300 leading-relaxed text-center mt-6"
                variants={itemVariants}
              >
                Feel the joy, the unity, and the cultural richness as we come together to welcome Navratri in the most exhilarating way possible. Join us for an unforgettable night of <span className="text-navratri-pink font-semibold">celebration</span>, <span className="text-navratri-green font-semibold">community</span>, and <span className="text-navratri-blue font-semibold">culture</span>.
              </motion.p>

              {/* Decorative elements */}
              <div className="flex justify-center mt-8 space-x-4">
                {['🎭', '💃', '🎵', '🎉'].map((emoji, index) => (
                  <motion.div
                    key={index}
                    className="text-3xl"
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
            className="mt-12 text-center"
          >
            <motion.p 
              className="text-navratri-yellow font-bold text-xl"
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