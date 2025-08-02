import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/common/navbar/Navbar';
import Footer from '../components/common/footer/Footer';

const PrivacyPolicy = () => {
  const navigate = useNavigate();
  
  // Scroll to top when component mounts
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navbar />
      
      <main className="pt-32 pb-16">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="container mx-auto px-4 max-w-4xl"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold font-serif bg-gradient-to-r from-navratri-orange via-navratri-yellow to-navratri-pink bg-clip-text text-transparent mb-4">
              Privacy Policy
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-navratri-orange to-navratri-pink rounded-full mx-auto mb-6"></div>
            <p className="text-slate-300 text-lg">
              Your privacy is important to us. This policy explains how we collect, use, and protect your information.
            </p>
          </motion.div>

          {/* Content */}
          <motion.div variants={itemVariants} className="bg-slate-800/30 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/30">
            <div className="prose prose-invert max-w-none">
              <div className="space-y-8 text-slate-300">
                
                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">Information We Collect</h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-semibold text-navratri-orange mb-2">Personal Information</h3>
                      <ul className="list-disc list-inside space-y-2 ml-4">
                        <li>Name and email address (via Google Sign-In)</li>
                        <li>Profile picture (if provided through Google)</li>
                        <li>Phone number (if provided during registration)</li>
                        <li>Payment information (processed securely through our payment partners)</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-semibold text-navratri-orange mb-2">Automatically Collected Information</h3>
                      <ul className="list-disc list-inside space-y-2 ml-4">
                        <li>Device information and browser type</li>
                        <li>IP address and location data</li>
                        <li>Usage patterns and preferences</li>
                        <li>Cookies and similar tracking technologies</li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">How We Use Your Information</h2>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>To process ticket purchases and send digital tickets</li>
                    <li>To communicate event updates and important information</li>
                    <li>To provide customer support and respond to inquiries</li>
                    <li>To improve our services and user experience</li>
                    <li>To prevent fraud and ensure security</li>
                    <li>To comply with legal obligations</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">Information Sharing</h2>
                  <p className="mb-4">We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>Service Providers:</strong> With trusted partners who help us operate our platform (payment processors, email services)</li>
                    <li><strong>Legal Requirements:</strong> When required by law or to protect our rights and safety</li>
                    <li><strong>Event Partners:</strong> Basic information may be shared with venue partners for security and logistics purposes</li>
                    <li><strong>With Your Consent:</strong> Any other sharing will be done only with your explicit permission</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">Data Security</h2>
                  <p className="mb-4">We implement industry-standard security measures to protect your information:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>SSL encryption for all data transmission</li>
                    <li>Secure servers with regular security updates</li>
                    <li>Limited access to personal information on a need-to-know basis</li>
                    <li>Regular security audits and monitoring</li>
                    <li>Secure payment processing through certified partners</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">Your Rights</h2>
                  <p className="mb-4">You have the following rights regarding your personal information:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
                    <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
                    <li><strong>Deletion:</strong> Request deletion of your personal information (subject to legal requirements)</li>
                    <li><strong>Portability:</strong> Request transfer of your data to another service</li>
                    <li><strong>Opt-out:</strong> Unsubscribe from marketing communications at any time</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">Cookies and Tracking</h2>
                  <p className="mb-4">We use cookies and similar technologies to:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Remember your preferences and settings</li>
                    <li>Analyze website traffic and usage patterns</li>
                    <li>Provide personalized content and advertisements</li>
                    <li>Ensure security and prevent fraud</li>
                  </ul>
                  <p className="mt-4">You can control cookie settings through your browser preferences.</p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">Data Retention</h2>
                  <p>We retain your personal information only as long as necessary to:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4 mt-4">
                    <li>Provide our services and support</li>
                    <li>Comply with legal obligations</li>
                    <li>Resolve disputes and enforce agreements</li>
                    <li>Improve our services</li>
                  </ul>
                  <p className="mt-4">Event-related data is typically retained for 3 years after the event date for record-keeping purposes.</p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">Children's Privacy</h2>
                  <p>Our services are not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately.</p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">Changes to This Policy</h2>
                  <p>We may update this Privacy Policy from time to time. We will notify you of any material changes by:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4 mt-4">
                    <li>Posting the updated policy on our website</li>
                    <li>Sending an email notification to registered users</li>
                    <li>Displaying a prominent notice on our platform</li>
                  </ul>
                  <p className="mt-4">Your continued use of our services after any changes constitutes acceptance of the updated policy.</p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">Contact Us</h2>
                  <p className="mb-4">If you have any questions about this Privacy Policy or our data practices, please contact us:</p>
                  <div className="bg-slate-700/50 rounded-xl p-6 space-y-2">
                    <p><strong>Email:</strong> hyyevents@gmail.com</p>
                    <p><strong>Phone:</strong> +91 90828 07701</p>
                    <p><strong>Address:</strong> Mumbai, Maharashtra, India</p>
                    <p><strong>Response Time:</strong> We aim to respond within 48 hours</p>
                  </div>
                </section>

                <section className="border-t border-slate-700/30 pt-6">
                  <p className="text-sm text-slate-400">
                    <strong>Last Updated:</strong> January 2025<br/>
                    <strong>Effective Date:</strong> January 1, 2025
                  </p>
                  <p className='text-m text-slate-400'> 
                    <strong>Ownership :</strong> HEET JAIN, YASH JAGDISH LIMBAD, YASH JAIN
                  </p>
                </section>
              </div>
            </div>
          </motion.div>

          {/* Back Button */}
          <motion.div variants={itemVariants} className="text-center mt-8">
            <motion.button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-navratri-orange text-white rounded-lg font-semibold hover:bg-navratri-orange/80 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              ← Back to Home
            </motion.button>
          </motion.div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;