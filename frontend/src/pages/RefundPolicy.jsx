import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/common/navbar/Navbar';
import Footer from '../components/common/footer/Footer';

const RefundPolicy = () => {
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
            <h1 className="text-4xl md:text-5xl font-bold font-serif bg-gradient-to-r from-navratri-green via-navratri-blue to-navratri-indigo bg-clip-text text-transparent mb-4">
              Refund Policy
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-navratri-green to-navratri-indigo rounded-full mx-auto mb-6"></div>
            <p className="text-slate-300 text-lg">
              Understanding our refund process and eligibility criteria.
            </p>
          </motion.div>

          {/* Content */}
          <motion.div variants={itemVariants} className="bg-slate-800/30 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/30">
            <div className="prose prose-invert max-w-none">
              <div className="space-y-8 text-slate-300">
                
                {/* Quick Summary */}
                <section className="bg-blue-900/20 border border-blue-700/30 rounded-xl p-6">
                  <h2 className="text-2xl font-bold text-blue-300 mb-4 flex items-center gap-2">
                    <span className="text-3xl">💰</span>
                    Refund Summary
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-blue-200">
                    <div>
                      <h4 className="font-semibold mb-2">✅ Eligible for Refund:</h4>
                      <ul className="text-sm space-y-1">
                        <li>• Cancellation 10+ days before event</li>
                        <li>• Event cancelled by organizers</li>
                        <li>• Technical issues during purchase</li>
                        <li>• Duplicate payments</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">❌ Not Eligible for Refund:</h4>
                      <ul className="text-sm space-y-1">
                        <li>• Cancellation within 10 days</li>
                        <li>• No-show at event</li>
                        <li>• Change of mind after deadline</li>
                        <li>• Personal emergencies (exceptions apply)</li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">Refund Eligibility</h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold text-navratri-green mb-3">Full Refund Scenarios</h3>
                      <ul className="list-disc list-inside space-y-2 ml-4">
                        <li><strong>Event Cancellation:</strong> If we cancel the event for any reason</li>
                        <li><strong>Technical Errors:</strong> System errors resulting in incorrect charges</li>
                        <li><strong>Duplicate Payments:</strong> Accidental multiple payments for the same ticket</li>
                        <li><strong>Unauthorized Transactions:</strong> Fraudulent use of payment methods</li>
                        <li><strong>Force Majeure:</strong> Natural disasters, government restrictions, etc.</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold text-navratri-orange mb-3">Partial Refund Scenarios</h3>
                      <ul className="list-disc list-inside space-y-2 ml-4">
                        <li><strong>Early Cancellation:</strong> Cancellation 10+ days before event (minus processing fees)</li>
                        <li><strong>Event Postponement:</strong> If you cannot attend the new date</li>
                        <li><strong>Venue Change:</strong> Significant venue changes affecting accessibility</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold text-navratri-red mb-3">No Refund Scenarios</h3>
                      <ul className="list-disc list-inside space-y-2 ml-4">
                        <li><strong>Late Cancellation:</strong> Cancellation within 10 days of event</li>
                        <li><strong>No-Show:</strong> Failure to attend the event</li>
                        <li><strong>Personal Reasons:</strong> Change of plans, travel issues, etc.</li>
                        <li><strong>Weather Conditions:</strong> Minor weather that doesn't affect the event</li>
                        <li><strong>Used Tickets:</strong> Tickets that have been scanned for entry</li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">Refund Process</h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold text-navratri-blue mb-3">Step-by-Step Process</h3>
                      <ol className="list-decimal list-inside space-y-3 ml-4">
                        <li>
                          <strong>Submit Request:</strong> Cancel your ticket through your dashboard or email us
                        </li>
                        <li>
                          <strong>Verification:</strong> We verify your eligibility and ticket details (1-2 business days)
                        </li>
                        <li>
                          <strong>Approval:</strong> You receive confirmation email with refund details
                        </li>
                        <li>
                          <strong>Processing:</strong> Refund is initiated to your original payment method
                        </li>
                        <li>
                          <strong>Completion:</strong> Funds appear in your account (timeline varies by payment method)
                        </li>
                      </ol>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold text-navratri-blue mb-3">Required Information</h3>
                      <ul className="list-disc list-inside space-y-2 ml-4">
                        <li>Full name and email address used for booking</li>
                        <li>Ticket ID or booking reference number</li>
                        <li>Reason for refund request</li>
                        <li>Original payment method details</li>
                        <li>Supporting documents (if applicable)</li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">Refund Timeline</h2>
                  <div className="space-y-4">
                    <div className="bg-slate-700/50 rounded-xl p-6">
                      <h3 className="text-xl font-semibold text-navratri-yellow mb-4">Processing Times by Payment Method</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold text-white mb-2">Credit/Debit Cards</h4>
                          <ul className="text-sm space-y-1">
                            <li>• Processing: 1-2 business days</li>
                            <li>• Bank processing: 3-5 business days</li>
                            <li>• Total time: 5-7 business days</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold text-white mb-2">Net Banking</h4>
                          <ul className="text-sm space-y-1">
                            <li>• Processing: 1 business day</li>
                            <li>• Bank processing: 2-4 business days</li>
                            <li>• Total time: 3-5 business days</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold text-white mb-2">UPI/Digital Wallets</h4>
                          <ul className="text-sm space-y-1">
                            <li>• Processing: 1 business day</li>
                            <li>• Wallet processing: 1-2 business days</li>
                            <li>• Total time: 2-3 business days</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold text-white mb-2">Bank Transfer</h4>
                          <ul className="text-sm space-y-1">
                            <li>• Processing: 2-3 business days</li>
                            <li>• Bank processing: 5-7 business days</li>
                            <li>• Total time: 7-10 business days</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">Fees and Deductions</h2>
                  <div className="space-y-4">
                    <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-6">
                      <h3 className="text-xl font-semibold text-yellow-300 mb-3">Processing Fees (Non-Refundable)</h3>
                      <div className="space-y-2 text-yellow-200">
                        <p><strong>Payment Gateway Fee:</strong> ₹25 per ticket</p>
                        <p><strong>Platform Processing Fee:</strong> ₹15 per ticket</p>
                        <p><strong>Total Deduction:</strong> ₹40 per ticket</p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold text-navratri-orange mb-3">Refund Calculation Examples</h3>
                      <div className="space-y-3">
                        <div className="bg-slate-700/30 rounded-lg p-4">
                          <p><strong>Example 1:</strong> Single ticket worth ₹500</p>
                          <p>Refund amount: ₹500 - ₹40 = <strong>₹460</strong></p>
                        </div>
                        <div className="bg-slate-700/30 rounded-lg p-4">
                          <p><strong>Example 2:</strong> 3 tickets worth ₹1,500 (₹500 each)</p>
                          <p>Refund amount: ₹1,500 - (₹40 × 3) = <strong>₹1,380</strong></p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">Special Circumstances</h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-semibold text-navratri-pink mb-3">Medical Emergencies</h3>
                      <ul className="list-disc list-inside space-y-2 ml-4">
                        <li>Considered on case-by-case basis</li>
                        <li>Valid medical certificate required</li>
                        <li>Must be submitted within 48 hours of incident</li>
                        <li>Subject to management approval</li>
                        <li>May qualify for full or partial refund</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold text-navratri-pink mb-3">Bereavement</h3>
                      <ul className="list-disc list-inside space-y-2 ml-4">
                        <li>Death certificate required</li>
                        <li>Must be immediate family member</li>
                        <li>Full refund including processing fees</li>
                        <li>Expedited processing within 3 business days</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold text-navratri-pink mb-3">Travel Restrictions</h3>
                      <ul className="list-disc list-inside space-y-2 ml-4">
                        <li>Government-imposed travel bans</li>
                        <li>Official documentation required</li>
                        <li>Partial refund after processing fees</li>
                        <li>Alternative: Transfer to future event</li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">Refund Alternatives</h2>
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-navratri-violet mb-3">Instead of Refund, Consider:</h3>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li><strong>Ticket Transfer:</strong> Transfer to a friend or family member (₹50 fee)</li>
                      <li><strong>Event Credit:</strong> Credit for future events (no processing fees)</li>
                      <li><strong>Donation:</strong> Donate ticket value to charity (tax benefits available)</li>
                      <li><strong>Resale Platform:</strong> Sell through our authorized resale platform</li>
                    </ul>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">Dispute Resolution</h2>
                  <div className="space-y-4">
                    <p>If you disagree with our refund decision:</p>
                    <ol className="list-decimal list-inside space-y-2 ml-4">
                      <li>Contact our customer support team within 7 days</li>
                      <li>Provide additional documentation if available</li>
                      <li>Request escalation to management</li>
                      <li>If unresolved, contact consumer forum</li>
                    </ol>
                    
                    <div className="bg-slate-700/50 rounded-xl p-4 mt-4">
                      <p className="text-sm">
                        <strong>Note:</strong> All disputes are subject to Mumbai jurisdiction and Indian law. 
                        We aim to resolve all disputes amicably and fairly.
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">Contact for Refunds</h2>
                  <div className="bg-slate-700/50 rounded-xl p-6 space-y-2">
                    <p><strong>Refund Email:</strong> hyyevents@gmail.com</p>
                    <p><strong>Support Phone:</strong> +91 9082807701</p>
                    <p><strong>WhatsApp:</strong> +91 9082807701</p>
                    <p><strong>Support Hours:</strong> 10:00 AM - 8:00 PM (Monday to Saturday)</p>
                    <p><strong>Response Time:</strong> Within 24 hours for refund queries</p>
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

export default RefundPolicy;