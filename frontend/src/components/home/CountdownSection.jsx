import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const CountdownSection = ({ event }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    if (!event?.date) return;

    const calculateTimeLeft = () => {
      const eventDate = new Date(event.date);
      const now = new Date();
      const difference = eventDate.getTime() - now.getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [event?.date]);

  if (!event?.date) return null;

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
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.6 },
    },
  };

  const timeUnits = [
    { label: 'Days', value: timeLeft.days, color: 'navratri-red' },
    { label: 'Hours', value: timeLeft.hours, color: 'navratri-orange' },
    { label: 'Minutes', value: timeLeft.minutes, color: 'navratri-yellow' },
    { label: 'Seconds', value: timeLeft.seconds, color: 'navratri-green' }
  ];

  return (
    <section className="py-12 sm:py-20 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-24 h-24 border border-navratri-red/10 rounded-full"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 border border-navratri-yellow/10 rounded-full"></div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        className="container mx-auto px-4 relative z-10"
      >
        <div className="max-w-4xl mx-auto">
          {/* Section Title */}
          <motion.div
            variants={itemVariants}
            className="text-center mb-8 sm:mb-12"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-serif bg-gradient-to-r from-navratri-red via-navratri-orange to-navratri-yellow bg-clip-text text-transparent mb-4">
              Event Countdown
            </h2>
            <div className="w-16 sm:w-24 h-1 bg-gradient-to-r from-navratri-red to-navratri-yellow rounded-full mx-auto mb-4"></div>
            <p className="text-slate-300 text-lg">
              The celebration begins in...
            </p>
          </motion.div>

          {/* Countdown Timer */}
          <motion.div
            variants={itemVariants}
            className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-slate-700/30"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {timeUnits.map((unit, index) => (
                <motion.div
                  key={unit.label}
                  className={`text-center bg-gradient-to-br from-${unit.color}/20 to-${unit.color}/10 rounded-2xl p-4 sm:p-6 border border-${unit.color}/30`}
                  whileHover={{ scale: 1.05 }}
                  animate={{
                    boxShadow: [
                      `0 0 20px rgba(255, 165, 0, 0.1)`,
                      `0 0 30px rgba(255, 165, 0, 0.2)`,
                      `0 0 20px rgba(255, 165, 0, 0.1)`
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                >
                  <motion.div
                    className={`text-3xl sm:text-4xl md:text-5xl font-bold text-${unit.color} mb-2`}
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1, repeat: Infinity, delay: index * 0.1 }}
                  >
                    {unit.value.toString().padStart(2, '0')}
                  </motion.div>
                  <p className="text-slate-300 font-medium text-sm sm:text-base">
                    {unit.label}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Event Date Display */}
            <div className="text-center mt-6 sm:mt-8">
              <p className="text-slate-400 text-sm mb-2">Event Date</p>
              <p className="text-white text-lg sm:text-xl font-semibold">
                {new Date(event.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
              {event.startTime && (
                <p className="text-slate-300 text-sm mt-1">
                  Starting at {event.startTime}
                </p>
              )}
            </div>
          </motion.div>

          {/* Urgency Message */}
          <motion.div
            variants={itemVariants}
            className="text-center mt-8"
          >
            <motion.p
              className="text-navratri-orange font-bold text-lg"
              animate={{
                opacity: [0.8, 1, 0.8],
                scale: [1, 1.02, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
            >
              ⏰ Don't miss out - Book your tickets now! ⏰
            </motion.p>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

export default CountdownSection;