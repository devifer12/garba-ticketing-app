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
      question: "Is parking available at the venue?",
      answer: "Yes! The venue has ample parking space for all attendees. Parking is free and the area is well-lit and secure."
    },
    {
      question: "What is the cancellation policy?",
      answer: "Tickets can be cancelled up to 10 days before the event date for a refund. Cancellations made within 10 days of the event are not eligible for refunds. Please refer to our Cancellation Policy for complete details."
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
    <section id="faq-section" className="py-12 sm:py-20 relative overflow-hidden">
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
        </div>
      </motion.div>
    </section>
  );
};

export default FAQSection;