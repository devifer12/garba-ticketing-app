import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/common/navbar/Navbar';
import Footer from '../components/common/footer/Footer';

const TermsOfService = () => {
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
            <h1 className="text-4xl md:text-5xl font-bold font-serif bg-gradient-to-r from-navratri-violet via-navratri-pink to-navratri-red bg-clip-text text-transparent mb-4">
              Terms of Service
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-navratri-violet to-navratri-red rounded-full mx-auto mb-6"></div>
            <p className="text-slate-300 text-lg">
              Please read these terms carefully before using our services.
            </p>
          </motion.div>

          {/* Content */}
          <motion.div variants={itemVariants} className="bg-slate-800/30 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/30">
            <div className="prose prose-invert max-w-none">
              <div className="space-y-8 text-slate-300">
                
                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">Acceptance of Terms</h2>
                  <p className="mb-4">
                    By accessing and using the Garba Rass 2025 ticketing platform, you accept and agree to be bound by the terms and provision of this agreement. 
                    If you do not agree to abide by the above, please do not use this service.
                  </p>
                  <p>
                    These terms apply to all visitors, users, and others who access or use the service.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">Use License</h2>
                  <p className="mb-4">
                    Permission is granted to temporarily download one copy of the materials on Garba Rass 2025's website for personal, 
                    non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>modify or copy the materials</li>
                    <li>use the materials for any commercial purpose or for any public display (commercial or non-commercial)</li>
                    <li>attempt to decompile or reverse engineer any software contained on the website</li>
                    <li>remove any copyright or other proprietary notations from the materials</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">Ticket Purchase and Use</h2>
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-navratri-orange mb-2">Purchase Terms</h3>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>All ticket sales are final unless cancelled within the specified timeframe</li>
                      <li>Tickets are non-transferable except through our official transfer process</li>
                      <li>You must be 18 years or older to purchase tickets</li>
                      <li>All information provided during purchase must be accurate and complete</li>
                      <li>We reserve the right to cancel orders that appear fraudulent</li>
                    </ul>

                    <h3 className="text-xl font-semibold text-navratri-orange mb-2 mt-6">Event Entry</h3>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Valid ticket and government-issued ID required for entry</li>
                      <li>Tickets must be presented in digital format via our app or email</li>
                      <li>Entry may be refused for inappropriate behavior or attire</li>
                      <li>Re-entry is not permitted once you leave the venue</li>
                      <li>Security screening may be required</li>
                    </ul>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">User Accounts</h2>
                  <p className="mb-4">
                    When you create an account with us, you must provide information that is accurate, complete, and current at all times. 
                    You are responsible for safeguarding the password and for all activities that occur under your account.
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>You must notify us immediately of any unauthorized use of your account</li>
                    <li>We reserve the right to terminate accounts that violate these terms</li>
                    <li>One account per person is permitted</li>
                    <li>Account sharing is prohibited</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">Prohibited Uses</h2>
                  <p className="mb-4">You may not use our service:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>For any unlawful purpose or to solicit others to perform unlawful acts</li>
                    <li>To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
                    <li>To infringe upon or violate our intellectual property rights or the intellectual property rights of others</li>
                    <li>To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
                    <li>To submit false or misleading information</li>
                    <li>To upload or transmit viruses or any other type of malicious code</li>
                    <li>To collect or track the personal information of others</li>
                    <li>To spam, phish, pharm, pretext, spider, crawl, or scrape</li>
                    <li>For any obscene or immoral purpose</li>
                    <li>To interfere with or circumvent the security features of the service</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">Event Policies</h2>
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-navratri-orange mb-2">Venue Rules</h3>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>No outside food or beverages allowed</li>
                      <li>No smoking or alcohol consumption</li>
                      <li>Appropriate traditional or formal attire required</li>
                      <li>No professional photography equipment without permission</li>
                      <li>Children under 5 enter free with paying adult</li>
                    </ul>

                    <h3 className="text-xl font-semibold text-navratri-orange mb-2 mt-6">Behavior Guidelines</h3>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Respectful behavior towards all attendees and staff</li>
                      <li>No disruptive or inappropriate conduct</li>
                      <li>Follow all safety instructions and guidelines</li>
                      <li>Respect cultural and religious sentiments</li>
                      <li>No unauthorized commercial activities</li>
                    </ul>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">Intellectual Property</h2>
                  <p className="mb-4">
                    The service and its original content, features, and functionality are and will remain the exclusive property of 
                    Garba Rass 2025 and its licensors. The service is protected by copyright, trademark, and other laws.
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Our trademarks and trade dress may not be used without our prior written consent</li>
                    <li>You may not reproduce, distribute, or create derivative works</li>
                    <li>All user-generated content remains your property but grants us usage rights</li>
                    <li>We respect intellectual property rights and expect users to do the same</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">Privacy and Data Protection</h2>
                  <p className="mb-4">
                    Your privacy is important to us. Our Privacy Policy explains how we collect, use, and protect your information 
                    when you use our service. By using our service, you agree to the collection and use of information in accordance with our Privacy Policy.
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>We collect only necessary information for service provision</li>
                    <li>Your data is protected using industry-standard security measures</li>
                    <li>We do not sell your personal information to third parties</li>
                    <li>You have rights regarding your personal data</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">Disclaimers</h2>
                  <div className="space-y-4">
                    <p>
                      The information on this website is provided on an "as is" basis. To the fullest extent permitted by law, 
                      this Company excludes all representations, warranties, conditions and terms.
                    </p>
                    
                    <h3 className="text-xl font-semibold text-navratri-orange mb-2">Service Availability</h3>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>We do not guarantee uninterrupted or error-free service</li>
                      <li>Technical issues may occasionally affect ticket purchases</li>
                      <li>We reserve the right to modify or discontinue services</li>
                      <li>Maintenance windows may temporarily affect availability</li>
                    </ul>

                    <h3 className="text-xl font-semibold text-navratri-orange mb-2 mt-6">Event Changes</h3>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Event details may change due to circumstances beyond our control</li>
                      <li>We will notify ticket holders of significant changes</li>
                      <li>Minor changes do not entitle refunds</li>
                      <li>Force majeure events may result in cancellation or postponement</li>
                    </ul>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">Limitation of Liability</h2>
                  <p className="mb-4">
                    In no event shall Garba Rass 2025, nor its directors, employees, partners, agents, suppliers, or affiliates, 
                    be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, 
                    loss of profits, data, use, goodwill, or other intangible losses.
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Our liability is limited to the amount paid for tickets</li>
                    <li>We are not responsible for personal injuries at the event</li>
                    <li>Travel and accommodation costs are not our responsibility</li>
                    <li>We are not liable for third-party actions or services</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">Indemnification</h2>
                  <p>
                    You agree to defend, indemnify, and hold harmless Garba Rass 2025 and its licensee and licensors, and their employees, 
                    contractors, agents, officers and directors, from and against any and all claims, damages, obligations, losses, liabilities, 
                    costs or debt, and expenses (including but not limited to attorney's fees).
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">Termination</h2>
                  <p className="mb-4">
                    We may terminate or suspend your account and bar access to the service immediately, without prior notice or liability, 
                    under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Termination may result in forfeiture of tickets without refund</li>
                    <li>You may terminate your account at any time</li>
                    <li>Certain provisions survive termination</li>
                    <li>We reserve the right to refuse service to anyone</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">Governing Law</h2>
                  <p>
                    These Terms shall be interpreted and governed by the laws of India, without regard to its conflict of law provisions. 
                    Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">Changes to Terms</h2>
                  <p className="mb-4">
                    We reserve the right, at our sole discretion, to modify or replace these Terms at any time. 
                    If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect.
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Changes will be posted on this page</li>
                    <li>Email notifications for significant changes</li>
                    <li>Continued use constitutes acceptance of new terms</li>
                    <li>You should review terms periodically</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">Contact Information</h2>
                  <p className="mb-4">If you have any questions about these Terms of Service, please contact us:</p>
                  <div className="bg-slate-700/50 rounded-xl p-6 space-y-2">
                    <p><strong>Email:</strong> hyyevents@gmail.com</p>
                    <p><strong>Phone:</strong> +91 9082807701</p>
                    <p><strong>Address:</strong> Mumbai, Maharashtra, India</p>
                    <p><strong>Business Hours:</strong> 10:00 AM - 6:00 PM (Monday to Friday)</p>
                  </div>
                </section>

                <section className="border-t border-slate-700/30 pt-6">
                  <p className="text-sm text-slate-400">
                    <strong>Last Updated:</strong> January 2025<br/>
                    <strong>Effective Date:</strong> January 1, 2025<br/>
                    <strong>Version:</strong> 1.0
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

export default TermsOfService;