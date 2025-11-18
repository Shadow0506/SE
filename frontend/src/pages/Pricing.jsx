import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api/api';

const Pricing = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [currentPlan, setCurrentPlan] = useState('free');
  const [billingCycle, setBillingCycle] = useState('monthly'); // monthly or yearly
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
    } else {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      // Get current plan from user data (default to free)
      setCurrentPlan(userData.subscriptionPlan || 'free');
    }
  }, [navigate]);

  const plans = {
    free: {
      name: 'Free',
      price: { monthly: 0, yearly: 0 },
      features: [
        { text: '20 questions/day', included: true },
        { text: '5 file uploads/day', included: true },
        { text: '10 MB storage', included: true },
        { text: 'Basic question types (MCQ, Short, T/F)', included: true },
        { text: 'Standard AI model', included: true },
        { text: 'Export to PDF', included: true },
        { text: 'Application questions', included: false },
        { text: 'Adaptive difficulty', included: false },
        { text: 'Priority support', included: false },
        { text: 'Advanced analytics', included: false }
      ],
      badge: 'Current Plan',
      color: 'gray'
    },
    student: {
      name: 'Student Pro',
      price: { monthly: 9.99, yearly: 99.99 },
      features: [
        { text: '100 questions/day', included: true },
        { text: '20 file uploads/day', included: true },
        { text: '50 MB storage', included: true },
        { text: 'All question types', included: true },
        { text: 'Advanced AI model', included: true },
        { text: 'Export to PDF & DOCX', included: true },
        { text: 'Application questions', included: true },
        { text: 'Adaptive difficulty', included: true },
        { text: 'Priority support', included: true },
        { text: 'Advanced analytics', included: true },
        { text: 'Custom difficulty levels', included: true }
      ],
      badge: 'Most Popular',
      color: 'blue',
      discount: 17 // yearly discount percentage
    },
    educator: {
      name: 'Educator',
      price: { monthly: 29.99, yearly: 299.99 },
      features: [
        { text: 'Unlimited questions/day', included: true },
        { text: 'Unlimited file uploads', included: true },
        { text: '500 MB storage', included: true },
        { text: 'All question types', included: true },
        { text: 'Premium AI model', included: true },
        { text: 'Export to PDF & DOCX', included: true },
        { text: 'Bulk file upload', included: true },
        { text: 'Class management', included: true },
        { text: 'Student progress tracking', included: true },
        { text: 'Custom branding', included: true },
        { text: 'Priority support 24/7', included: true },
        { text: 'API access', included: true }
      ],
      badge: 'Best Value',
      color: 'purple',
      discount: 17 // yearly discount percentage
    },
    enterprise: {
      name: 'Enterprise',
      price: { monthly: 99.99, yearly: 999.99 },
      features: [
        { text: 'Everything in Educator', included: true },
        { text: 'Unlimited storage', included: true },
        { text: 'Custom AI model training', included: true },
        { text: 'White-label solution', included: true },
        { text: 'Multiple team members', included: true },
        { text: 'Advanced security & compliance', included: true },
        { text: 'Dedicated account manager', included: true },
        { text: 'Custom integrations', included: true },
        { text: 'SLA guarantee', included: true },
        { text: 'On-premise deployment option', included: true }
      ],
      badge: 'For Organizations',
      color: 'green',
      discount: 17 // yearly discount percentage
    }
  };

  const handleUpgrade = (planKey) => {
    if (planKey === 'free') return;
    setSelectedPlan(planKey);
    setShowUpgradeModal(true);
  };

  const handleConfirmUpgrade = async () => {
    setProcessing(true);
    
    try {
      // Call backend API to update subscription in database
      const response = await authAPI.updateSubscription({
        userId: user.id,
        userType: user.userType,
        subscriptionPlan: selectedPlan,
        billingCycle: billingCycle
      });

      // Update localStorage with the response from backend
      const updatedUser = {
        ...user,
        subscriptionPlan: response.user.subscriptionPlan,
        subscriptionStatus: response.user.subscriptionStatus,
        subscriptionBillingCycle: response.user.subscriptionBillingCycle,
        subscriptionStartDate: response.user.subscriptionStartDate,
        quota: response.user.quota
      };
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setCurrentPlan(selectedPlan);
      
      setProcessing(false);
      setShowUpgradeModal(false);
      
      // Show success message and reload to update all components
      alert(`Successfully upgraded to ${plans[selectedPlan].name}! Your new quotas are now active.`);
      
      // Reload the page to ensure all components get the updated quota
      window.location.reload();
    } catch (error) {
      console.error('Subscription update error:', error);
      setProcessing(false);
      alert(error.response?.data?.error || 'Failed to update subscription. Please try again.');
    }
  };

  const formatPrice = (planKey) => {
    const plan = plans[planKey];
    const price = billingCycle === 'monthly' ? plan.price.monthly : plan.price.yearly;
    
    if (price === 0) return 'Free';
    
    if (billingCycle === 'yearly') {
      const monthlyEquivalent = (price / 12).toFixed(2);
      return (
        <div>
          <div className="text-4xl font-bold">${monthlyEquivalent}</div>
          <div className="text-sm text-gray-500">/month (billed yearly)</div>
          <div className="text-xs text-green-600 font-semibold mt-1">
            Save {plan.discount}% 🎉
          </div>
        </div>
      );
    }
    
    return (
      <div className="text-4xl font-bold">${price}<span className="text-lg text-gray-500">/mo</span></div>
    );
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">💎 Pricing Plans</h1>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100 transition-all"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Current Plan Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-2">Your Current Plan</h2>
              <p className="text-3xl font-bold">{plans[currentPlan].name}</p>
            </div>
            <div className="text-right">
              <div className="text-sm opacity-90 mb-1">Status</div>
              <div className="text-2xl font-semibold">✓ Active</div>
            </div>
          </div>
        </div>

        {/* Billing Cycle Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-xl shadow-md p-2 inline-flex gap-2">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                billingCycle === 'yearly'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Yearly <span className="text-green-600 text-xs ml-1">Save 17%</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Object.keys(plans).map((planKey) => {
            const plan = plans[planKey];
            const isCurrent = currentPlan === planKey;
            
            return (
              <div
                key={planKey}
                className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl ${
                  isCurrent ? 'ring-4 ring-blue-500' : ''
                }`}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className={`bg-gradient-to-r ${
                    plan.color === 'gray' ? 'from-gray-500 to-gray-600' :
                    plan.color === 'blue' ? 'from-blue-500 to-blue-600' :
                    plan.color === 'purple' ? 'from-purple-500 to-purple-600' :
                    'from-green-500 to-green-600'
                  } text-white text-center py-2 text-sm font-semibold`}>
                    {plan.badge}
                  </div>
                )}

                <div className="p-6">
                  {/* Plan Name */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{plan.name}</h3>

                  {/* Price */}
                  <div className="mb-6">
                    {formatPrice(planKey)}
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className={`text-lg ${feature.included ? 'text-green-500' : 'text-gray-300'}`}>
                          {feature.included ? '✓' : '✗'}
                        </span>
                        <span className={`text-sm ${feature.included ? 'text-gray-700' : 'text-gray-400'}`}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* Action Button */}
                  <button
                    onClick={() => handleUpgrade(planKey)}
                    disabled={isCurrent || planKey === 'free'}
                    className={`w-full py-3 rounded-lg font-semibold transition-all ${
                      isCurrent
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : planKey === 'free'
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg transform hover:-translate-y-0.5'
                    }`}
                  >
                    {isCurrent ? 'Current Plan' : planKey === 'free' ? 'Free Forever' : 'Upgrade Now'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-xl shadow-md p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Can I change my plan later?</h4>
              <p className="text-gray-600 text-sm">Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">What payment methods do you accept?</h4>
              <p className="text-gray-600 text-sm">We accept all major credit cards, PayPal, and bank transfers for Enterprise plans.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Is there a refund policy?</h4>
              <p className="text-gray-600 text-sm">Yes! We offer a 30-day money-back guarantee for all paid plans, no questions asked.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Do you offer student discounts?</h4>
              <p className="text-gray-600 text-sm">Yes! Students with a valid .edu email get an additional 20% off all plans. Contact support to verify.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Confirm Upgrade</h2>
            
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <div className="text-sm text-gray-600 mb-2">Upgrading to:</div>
              <div className="text-2xl font-bold text-blue-600 mb-2">{plans[selectedPlan].name}</div>
              <div className="text-3xl font-bold text-gray-900">
                ${billingCycle === 'monthly' 
                  ? plans[selectedPlan].price.monthly 
                  : (plans[selectedPlan].price.yearly / 12).toFixed(2)}
                <span className="text-lg text-gray-500">/month</span>
              </div>
              {billingCycle === 'yearly' && (
                <div className="text-sm text-green-600 font-semibold mt-2">
                  Billed ${plans[selectedPlan].price.yearly} yearly (Save 17%)
                </div>
              )}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-2">
                <span className="text-yellow-600 text-xl">💳</span>
                <div className="text-sm text-yellow-800">
                  <strong>Demo Mode:</strong> This is a simulated transaction. No actual payment will be processed.
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowUpgradeModal(false)}
                disabled={processing}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmUpgrade}
                disabled={processing}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  'Confirm Upgrade'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pricing;
