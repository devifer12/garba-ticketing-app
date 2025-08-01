import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/common/navbar/Navbar';
import Footer from '../components/common/footer/Footer';

const CancellationPolicy = () => {
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
            <h1 className="text-4xl md:text-5xl font-bold font-serif bg-gradient-to-r from-navratri-red via-navratri-orange to-navratri-yellow bg-clip-text text-transparent mb-4">
              Cancellation Policy
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-navratri-red to-navratri-yellow rounded-full mx-auto mb-6"></div>
            <p className="text-slate-300 text-lg">
              Please read our cancellation policy carefully before purchasing tickets.
            </p>
          </motion.div>

          {/* Content */}
          <motion.div variants={itemVariants} className="bg-slate-800/30 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/30">
            <div className="prose prose-invert max-w-none">
              <div className="space-y-8 text-slate-300">
                
                {/* Important Notice */}
                <section className="bg-red-900/20 border border-red-700/30 rounded-xl p-6">
                  <h2 className="text-2xl font-bold text-red-300 mb-4 flex items-center gap-2">
                    <span className="text-3xl">⚠️</span>
                    Important Notice
                  </h2>
                  <p className="text-red-200 text-lg font-medium">
                    All ticket cancellations must be requested at least <strong>10 days before the event date</strong> to be eligible for a refund. 
                    Cancellations requested within 10 days of the event will not be processed.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">Cancellation Timeline</h2>
                  <div className="space-y-6">
                    <div className="bg-green-900/20 border border-green-700/30 rounded-xl p-6">
                      <h3 className="text-xl font-semibold text-green-300 mb-3 flex items-center gap-2">
                        <span className="text-2xl">✅</span>
                        More than 10 Days Before Event
                      </h3>
                      <ul className="list-disc list-inside space-y-2 ml-4 text-green-200">
                        <li>Full refund available (minus processing fees)</li>
                        <li>Cancellation can be processed online</li>
                        <li>Refund processed within 5-10 business days</li>
                        <li>Email confirmation sent immediately</li>
                      </ul>
                    </div>

                    <div className="bg-red-900/20 border border-red-700/30 rounded-xl p-6">
                      <h3 className="text-xl font-semibold text-red-300 mb-3 flex items-center gap-2">
                        <span className="text-2xl">❌</span>
                        Within 10 Days of Event
                      </h3>
                      <ul className="list-disc list-inside space-y-2 ml-4 text-red-200">
                        <li>No cancellations accepted</li>
                        <li>No refunds available</li>
                        <li>Tickets remain valid for the event</li>
                        <li>Transfer to another person may be possible (contact support)</li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">How to Cancel Your Ticket</h2>
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-navratri-orange mb-2">Online Cancellation (Recommended)</h3>
                    <ol className="list-decimal list-inside space-y-2 ml-4">
                      <li>Log in to your account on our website</li>
                      <li>Go to "My Tickets" section in your dashboard</li>
                      <li>Select the ticket(s) you want to cancel</li>
                      <li>Click "Request Cancellation"</li>
                      <li>Confirm your cancellation request</li>
                      <li>You will receive an email confirmation</li>
                    </ol>

                    <h3 className="text-xl font-semibold text-navratri-orange mb-2 mt-6">Email Cancellation</h3>
                    <p className="mb-2">If you cannot access your account, email us at:</p>
                    <div className="bg-slate-700/50 rounded-xl p-4">
                      <p><strong>Email:</strong> hyyevents@gmail.com</p>
                      <p><strong>Subject:</strong> Ticket Cancellation Request</p>
                      <p><strong>Include:</strong> Your full name, email address, and ticket ID</p>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">Refund Process</h2>
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-navratri-orange mb-2">Processing Fees</h3>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Payment gateway fees: ₹10 per ticket (non-refundable)</li>
                      <li>Platform processing fee: ₹10 per ticket (non-refundable)</li>
                      <li>Total deduction: ₹20 per cancelled ticket</li>
                    </ul>

                    <h3 className="text-xl font-semibold text-navratri-orange mb-2 mt-6">Refund Timeline</h3>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li><strong>All Payment Methods:</strong> 5-10 business days</li>
                      <li><strong>Processing Fee:</strong> ₹20 will be deducted</li>
                      <li><strong>Refund Amount:</strong> Original price minus ₹20 processing fee</li>
                      <li><strong>Email Updates:</strong> You'll receive status notifications</li>
                    </ul>

                    <div className="bg-blue-900/20 border border-blue-700/30 rounded-xl p-4 mt-4">
                      <p className="text-blue-200">
                        <strong>Note:</strong> Refunds are processed automatically via Razorpay. In case of technical issues, 
                        refunds may be processed manually within 5-7 business days.
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">Special Circumstances</h2>
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-navratri-orange mb-2">Event Cancellation by Organizers</h3>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Full refund including all fees</li>
                      <li>Automatic processing within 7 business days</li>
                      <li>Email notification to all ticket holders</li>
                      <li>Option to transfer to rescheduled date (if applicable)</li>
                    </ul>

                    <h3 className="text-xl font-semibold text-navratri-orange mb-2 mt-6">Medical Emergencies</h3>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Cancellations due to medical emergencies may be considered on a case-by-case basis</li>
                      <li>Valid medical certificate required</li>
                      <li>Contact our support team immediately</li>
                      <li>Subject to management approval</li>
                    </ul>

                    <h3 className="text-xl font-semibold text-navratri-orange mb-2 mt-6">Force Majeure Events</h3>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Natural disasters, government restrictions, etc.</li>
                      <li>Full refund or event postponement</li>
                      <li>Decision made in consultation with authorities</li>
                      <li>Updates communicated via email and website</li>
                    </ul>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">Ticket Transfer Policy</h2>
                  <p className="mb-4">If you cannot attend but cancellation is not possible:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Tickets can be transferred to another person</li>
                    <li>Transfer fee: ₹50 per ticket</li>
                    <li>Both parties must provide valid identification</li>
                    <li>Transfer must be completed 24 hours before the event</li>
                    <li>Contact support for transfer assistance</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">Important Terms</h2>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>All cancellation requests are subject to verification</li>
                    <li>Fraudulent cancellation requests will be rejected</li>
                    <li>Partial cancellations are allowed for multiple ticket purchases</li>
                    <li>Group booking cancellations follow the same policy</li>
                    <li>This policy is subject to change with prior notice</li>
                    <li>Disputes will be resolved as per Indian law</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">Contact Information</h2>
                  <p className="mb-4">For cancellation support and queries:</p>
                  <div className="bg-slate-700/50 rounded-xl p-6 space-y-2">
                    <p><strong>Cancellation Email:</strong> hyyevents@gmail.com</p>
                    <p><strong>Support Phone:</strong> +91 90828 07701</p>
                    <p><strong>Support Hours:</strong> 10:00 AM - 8:00 PM (Monday to Saturday)</p>
                    <p><strong>Emergency Contact:</strong> +91 90828 07701 (Event day only)</p>
                  </div>
                </section>

                <section className="border-t border-slate-700/30 pt-6">
                  <p className="text-sm text-slate-400">
                    <strong>Last Updated:</strong> January 2025<br/>
                    <strong>Effective Date:</strong> January 1, 2025<br/>
                    <strong>Policy Version:</strong> 2.0
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

export default CancellationPolicy;