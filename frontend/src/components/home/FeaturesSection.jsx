import React from 'react';
import { motion } from 'framer-motion';

const FeaturesSection = ({ event }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  if (!event?.features || event.features.length === 0) return null;

  return (
    <section className="py-12 sm:py-20 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-40 h-40 border border-navratri-violet/10 rounded-full"></div>
        <div className="absolute bottom-20 right-20 w-32 h-32 border border-navratri-pink/10 rounded-full"></div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        className="container mx-auto px-4 relative z-10"
      >
        <div className="max-w-6xl mx-auto">
          {/* Section Title */}
          <motion.div
            variants={itemVariants}
            className="text-center mb-8 sm:mb-12"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-serif bg-gradient-to-r from-navratri-violet via-navratri-pink to-navratri-red bg-clip-text text-transparent mb-4">
              Event Features
            </h2>
            <div className="w-16 sm:w-24 h-1 bg-gradient-to-r from-navratri-violet to-navratri-pink rounded-full mx-auto mb-4"></div>
            <p className="text-slate-300 text-lg max-w-2xl mx-auto">
              Discover what makes this Garba celebration truly special
            </p>
          </motion.div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {event.features.map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/30 hover:border-navratri-pink/30 transition-all duration-300 group"
                whileHover={{ y: -5, scale: 1.02 }}
              >
                {/* Feature Icon */}
                <motion.div
                  className="text-4xl mb-4 text-center"
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: index * 0.2,
                  }}
                >
                  {getFeatureIcon(feature, index)}
                </motion.div>

                {/* Feature Content */}
                <div className="text-center">
                  <h3 className="text-white font-bold text-lg mb-2 group-hover:text-navratri-pink transition-colors">
                    {feature}
                  </h3>
                  <p className="text-slate-400 text-sm">
                    {getFeatureDescription(feature)}
                  </p>
                </div>

                {/* Hover Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-navratri-pink/5 to-navratri-violet/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </motion.div>
            ))}
          </div>

          {/* Call to Action */}
          <motion.div
            variants={itemVariants}
            className="text-center mt-12"
          >
            <motion.p
              className="text-navratri-pink font-bold text-lg"
              animate={{
                opacity: [0.8, 1, 0.8],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
            >
              ✨ Experience all these amazing features and more! ✨
            </motion.p>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

// Helper function to get appropriate icon for each feature
const getFeatureIcon = (feature, index) => {
  const featureText = feature.toLowerCase();
  
  if (featureText.includes('music') || featureText.includes('dj') || featureText.includes('sound')) {
    return '🎵';
  }else if (featureText.includes('dance') || featureText.includes('garba') || featureText.includes('raas')) {
    return '💃';
  } else if (featureText.includes('photo') || featureText.includes('camera') || featureText.includes('picture')) {
    return '📸';
  } else if (featureText.includes('gift') || featureText.includes('prize') || featureText.includes('reward')) {
    return '🎁';
  } else if (featureText.includes('competition') || featureText.includes('contest') || featureText.includes('game')) {
    return '🏆';
  } else if (featureText.includes('decoration') || featureText.includes('decor') || featureText.includes('theme')) {
    return '🎨';
  } else if (featureText.includes('light') || featureText.includes('lighting') || featureText.includes('led')) {
    return '💡';
  } else if (featureText.includes('costume') || featureText.includes('dress') || featureText.includes('attire')) {
    return '👗';
  } else if (featureText.includes('parking') || featureText.includes('valet')) {
    return '🚗';
  } else {
    // Default icons based on index
    const defaultIcons = ['🎭', '🎪', '🎊', '🎉', '✨', '🌟', '💫', '🎈', '🎀', '🎯'];
    return defaultIcons[index % defaultIcons.length];
  }
};

// Helper function to get description for each feature
const getFeatureDescription = (feature) => {
  const featureText = feature.toLowerCase();
  
  if (featureText.includes('music') || featureText.includes('dj')) {
    return 'Professional DJ with traditional and modern Garba music';
  } else if (featureText.includes('dance') || featureText.includes('garba')) {
    return 'Traditional dance performances and competitions';
  } else if (featureText.includes('photo')) {
    return 'Professional photography and memorable moments';
  } else if (featureText.includes('gift') || featureText.includes('prize')) {
    return 'Exciting prizes and surprise giveaways';
  } else if (featureText.includes('competition')) {
    return 'Fun competitions with amazing prizes';
  } else {
    return 'An amazing addition to make your experience unforgettable';
  }
};

export default FeaturesSection;