import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebook, faInstagram } from '@fortawesome/free-brands-svg-icons';


const Footer = () => {
  const navigate = useNavigate();

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

  const footerLinks = {
    policies: [
      { name: 'Privacy Policy', path: '/privacy-policy' },
      { name: 'Cancellation Policy', path: '/cancellation-policy' },
      { name: 'Refund Policy', path: '/refund-policy' },
      { name: 'Terms of Service', path: '/terms-of-service' }
    ],
    quickLinks: [
      { name: 'About Event', action: () => {
        const aboutSection = document.getElementById('about-section');
        if (aboutSection) {
          aboutSection.scrollIntoView({ behavior: 'smooth' });
        }
      }},
      { name: 'FAQ', action: () => {
        const faqSection = document.getElementById('faq-section');
        if (faqSection) {
          faqSection.scrollIntoView({ behavior: 'smooth' });
        }
      }},
      { name: 'Contact Support', action: () => {
        window.location.href = 'mailto:hyyevents@gmail.com';
      }}
    ]
  };

  const socialLinks = [
    { name: 'Facebook', icon: <FontAwesomeIcon icon={faFacebook} style={{ color: 'blue' }} />, url: '#' },
    { name: 'Instagram', icon: <FontAwesomeIcon icon={faInstagram} style={{ color: 'red' }}/>, url: 'https://lnk.ink/HYYEVENTS' },
  ];

  return (
    <footer className="bg-slate-900/80 backdrop-blur-xl border-t border-slate-700/30 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-20 h-20 border border-navratri-orange/10 rounded-full"></div>
        <div className="absolute bottom-10 right-10 w-24 h-24 border border-navratri-pink/10 rounded-full"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-navratri-yellow/5 rounded-full blur-xl"></div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        className="container mx-auto px-4 py-12 relative z-10"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <motion.h3 
              className="text-2xl sm:text-3xl font-bold font-serif bg-gradient-to-r from-navratri-orange via-navratri-yellow to-navratri-pink bg-clip-text text-transparent mb-4"
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                repeatType: "loop",
              }}
              style={{
                backgroundSize: "200% 200%",
              }}
            >
              Garba Rass 2025
            </motion.h3>
            <p className="text-slate-300 mb-6 max-w-md leading-relaxed">
              Join us for an unforgettable Pre-Navratri celebration filled with traditional dance, 
              vibrant music, and cultural festivities. Experience the joy of Garba and Raas in 
              its most authentic form.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-2 text-slate-400 text-sm">
              <div className="flex items-center gap-2">
                <span>📧</span>
                <a href="mailto:hyyevents@gmail.com" className="hover:text-navratri-orange transition-colors">
                  hyyevents@gmail.com
                </a>
              </div>
              <div className="flex items-center gap-2">
              </div>
              <div className="flex items-center gap-2">
                <span>📍</span>
                <span>Mumbai, Maharashtra, India</span>
              </div>
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div variants={itemVariants}>
            <h4 className="text-white font-bold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {footerLinks.quickLinks.map((link, index) => (
                <li key={index}>
                  <motion.button
                    onClick={link.action}
                    className="text-slate-400 hover:text-navratri-orange transition-colors text-sm"
                    whileHover={{ x: 5 }}
                  >
                    {link.name}
                  </motion.button>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Policies */}
          <motion.div variants={itemVariants}>
            <h4 className="text-white font-bold text-lg mb-4">Policies</h4>
            <ul className="space-y-2">
              {footerLinks.policies.map((link, index) => (
                <li key={index}>
                  <motion.button
                    className="text-slate-400 hover:text-navratri-orange transition-colors text-sm"
                    whileHover={{ x: 5 }}
                    onClick={() => {
                      navigate(link.path);
                      window.scrollTo({ top: 0, behavior: "instant" });
                    }}
                  >
                    {link.name}
                  </motion.button>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Social Links */}
        <motion.div 
          variants={itemVariants}
          className="mt-12 pt-8 border-t border-slate-700/30"
        >
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
              <span className="text-slate-400 text-sm">Follow us:</span>
              <div className="flex gap-3">
                {socialLinks.map((social, index) => (
                  <motion.a
                    key={index}
                    href={social.url}
                    className="w-10 h-10 bg-slate-800/50 backdrop-blur-xl rounded-full flex items-center justify-center text-lg hover:bg-navratri-orange/20 hover:text-navratri-orange transition-all border border-slate-700/30"
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    title={social.name}
                  >
                    {social.icon}
                  </motion.a>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Copyright */}
        <motion.div 
          variants={itemVariants}
          className="mt-8 pt-6 border-t border-slate-700/30 text-center"
        >
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-slate-400 text-sm">
            <p>
              © 2025 Garba Rass. All rights reserved. Made with ❤️ for the Navratri community.
            </p>
            <div className="flex items-center gap-4">
              <span>🔒 Secure Payments</span>
              <span>•</span>
              <span>📱 Mobile Friendly</span>
              <span>•</span>
              <span>🎫 Digital Tickets</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-700/20">
            <p className="text-slate-500 text-xs">Organised by HYY EVENTS</p>
          </div>
        </motion.div>

        {/* Decorative Elements */}
        <div className="absolute bottom-4 left-4 opacity-20">
          <motion.div
            className="text-4xl"
            animate={{
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
            }}
          >
            🎭
          </motion.div>
        </div>
        
        <div className="absolute bottom-4 right-4 opacity-20">
          <motion.div
            className="text-4xl"
            animate={{
              rotate: [0, -10, 10, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: 2,
            }}
          >
            💃
          </motion.div>
        </div>
      </motion.div>
    </footer>
  );
};

export default Footer;