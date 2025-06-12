import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FAQSection = () => {
  const [openFAQ, setOpenFAQ] = useState(null);

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

  const faqs = [
    {
      question: "What should I wear to the Garba event?",
      answer: "Traditional Gujarati attire is encouraged! Women can wear chaniya choli, lehenga, or sarees, while men can wear kurta-pajama or dhoti. However, comfortable clothing that allows easy movement is most important for dancing."
    },
    {
      question: "Are there any age restrictions?",
      answer: "Our Garba event is family-friendly and welcomes all ages! Children under 5 can enter free with a paying adult. We have activities suitable for everyone from toddlers to grandparents."
    },
    {
      question: "What food and drinks will be available?",
      answer: "We'll have authentic Gujarati snacks including dhokla, khandvi, fafda, and traditional sweets. Refreshing drinks like chaas, fresh lime water, and soft drinks will also be available. All food is vegetarian."
    },
    {
      question: "Is parking available at the venue?",
      answer: "Yes! The venue has ample parking space for all attendees. Parking is free and the area is well-lit and secure. We also recommend carpooling or using public transport when possible."
    },
    {
      question: "Can I get a refund if I can't attend?",
      answer: "Tickets can be cancelled up to 24 hours before the event for a full refund. After that, tickets are non-refundable but can be transferred to another person by contacting our support team."
    },
    {
      question: "Will there be dance instruction for beginners?",
      answer: "Absolutely! We'll have professional dance instructors available to teach basic Garba and Raas steps. Beginner-friendly sessions will be held throughout the evening, so don't worry if you're new to Garba!"
    },
    {
      question: "What COVID-19 safety measures are in place?",
      answer: "We follow all local health guidelines. The venue is well-ventilated, hand sanitizers are available throughout, and we maintain appropriate spacing where possible. Please stay home if you're feeling unwell."
    },
    {
      question: "Can I bring my own dandiya sticks?",
      answer: "Yes, you're welcome to bring your own dandiya sticks! We'll also have some available for rent at the venue. All sticks must be traditional wooden ones for safety reasons."
    }
  ];

  const toggleFAQ = (index) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <section className="py-12 sm:py-20 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-20 w-32 h-32 border border-navratri-yellow/10 rounded-full"></div>
        <div className="absolute bottom-20 left-20 w-28 h-28 border border-navratri-red/10 rounded-full"></div>
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
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-serif bg-gradient-to-r from-navratri-yellow via-navratri-orange to-navratri-red bg-clip-text text-transparent mb-4">
              Frequently Asked Questions
            </h2>
            <div className="w-16 sm:w-24 h-1 bg-gradient-to-r from-navratri-yellow to-navratri-red rounded-full mx-auto mb-4"></div>
            <p className="text-slate-300 text-lg max-w-2xl mx-auto">
              Got questions? We've got answers! Find everything you need to know about our Garba celebration.
            </p>
          </motion.div>

          {/* FAQ List */}
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/30 overflow-hidden"
              >
                <motion.button
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-slate-700/30 transition-colors"
                  onClick={() => toggleFAQ(index)}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <span className="text-white font-semibold text-lg pr-4">
                    {faq.question}
                  </span>
                  <motion.div
                    animate={{ rotate: openFAQ === index ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex-shrink-0"
                  >
                    <svg 
                      className="w-6 h-6 text-navratri-orange" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M19 9l-7 7-7-7" 
                      />
                    </svg>
                  </motion.div>
                </motion.button>

                <AnimatePresence>
                  {openFAQ === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-4">
                        <div className="border-t border-slate-700/30 pt-4">
                          <p className="text-slate-300 leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>

          {/* Contact Section */}
          <motion.div
            variants={itemVariants}
            className="mt-12 text-center"
          >
            <div className="bg-gradient-to-r from-navratri-orange/20 to-navratri-yellow/20 rounded-2xl p-6 sm:p-8 border border-navratri-orange/30">
              <h3 className="text-white font-bold text-xl mb-4">
                Still have questions?
              </h3>
              <p className="text-slate-300 mb-6">
                Can't find the answer you're looking for? Our friendly team is here to help!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.button
                  className="px-6 py-3 bg-navratri-orange text-white rounded-lg font-semibold hover:bg-navratri-orange/80 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  📧 Contact Support
                </motion.button>
                <motion.button
                  className="px-6 py-3 bg-slate-700/50 text-slate-300 border border-slate-600/30 rounded-lg hover:bg-slate-700/70 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  💬 Live Chat
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

export default FAQSection;