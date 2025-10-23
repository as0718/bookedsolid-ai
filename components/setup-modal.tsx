'use client';

import { useState } from 'react';
import { useSetup } from '@/contexts/SetupContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface Plan {
  id: 'missed' | 'complete' | 'unlimited';
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
  recommended?: boolean;
}

const PLANS: Plan[] = [
  {
    id: 'missed',
    name: 'Missed Call Plan',
    description: 'Perfect for after-hours coverage',
    monthlyPrice: 149,
    annualPrice: 1700,
    features: [
      '500 minutes/month',
      'After-hours call coverage',
      'Basic appointment booking',
      'Email notifications',
      'Standard support',
    ],
  },
  {
    id: 'complete',
    name: 'Complete Plan',
    description: 'Full-featured call management',
    monthlyPrice: 349,
    annualPrice: 4000,
    recommended: true,
    features: [
      '1,000 minutes/month',
      '24/7 call coverage',
      'Advanced appointment booking',
      'CRM integration',
      'SMS + Email notifications',
      'Priority support',
    ],
  },
  {
    id: 'unlimited',
    name: 'Unlimited Plan',
    description: 'Enterprise-grade solution',
    monthlyPrice: 599,
    annualPrice: 7000,
    features: [
      'Unlimited minutes',
      '24/7 premium call coverage',
      'Full appointment management',
      'Advanced CRM integration',
      'Custom AI training',
      'SMS + Email + Slack notifications',
      'Dedicated account manager',
    ],
  },
];

export default function SetupModal() {
  const { showSetup, dismissSetup } = useSetup();
  const [selectedPlan, setSelectedPlan] = useState<'missed' | 'complete' | 'unlimited'>('complete');
  const [selectedInterval, setSelectedInterval] = useState<'month' | 'year'>('month');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!showSetup) return null;

  const handleSetupLater = async () => {
    const confirmed = window.confirm(
      'Without billing setup, you will not see any dashboard data. You can set this up later in billing settings.\n\nAre you sure you want to skip setup?'
    );

    if (confirmed) {
      await dismissSetup();
    }
  };

  const handleSubscribe = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Create Stripe checkout session
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: selectedPlan,
          interval: selectedInterval,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();

      // Redirect to Stripe Checkout
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      setError(error instanceof Error ? error.message : 'Failed to start subscription process');
      setIsLoading(false);
    }
  };

  const selectedPlanDetails = PLANS.find(p => p.id === selectedPlan);
  const price = selectedInterval === 'month'
    ? selectedPlanDetails?.monthlyPrice
    : selectedPlanDetails?.annualPrice;
  const savings = selectedInterval === 'year' && selectedPlanDetails
    ? (selectedPlanDetails.monthlyPrice * 12) - selectedPlanDetails.annualPrice
    : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-5xl w-full my-8">
        <div className="p-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">Choose Your Plan</h2>
            <p className="text-gray-600 text-lg mb-1">
              Select the perfect plan for your AI-powered call management
            </p>
            <p className="text-gray-500 text-sm">
              Step 2 of 2: Plan Selection
            </p>
          </div>

          {/* Billing Interval Toggle */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50">
              <button
                onClick={() => setSelectedInterval('month')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedInterval === 'month'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setSelectedInterval('year')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  selectedInterval === 'year'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Annual
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  Save 17%
                </Badge>
              </button>
            </div>
          </div>

          {/* Plans Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {PLANS.map((plan) => (
              <Card
                key={plan.id}
                className={`cursor-pointer transition-all relative ${
                  selectedPlan === plan.id
                    ? 'border-blue-500 border-2 shadow-lg'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {plan.recommended && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-600 text-white">Recommended</Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold">
                        ${selectedInterval === 'month' ? plan.monthlyPrice : plan.annualPrice}
                      </span>
                      <span className="text-gray-600 ml-2">
                        {selectedInterval === 'year' ? '/year' : '/month'}
                      </span>
                    </div>
                    {selectedInterval === 'year' && (
                      <p className="text-sm text-green-600 mt-1">
                        Save ${(plan.monthlyPrice * 12) - plan.annualPrice}/year
                      </p>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start text-sm">
                        <svg
                          className="w-5 h-5 text-green-500 mr-2 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Terms and Actions */}
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="text-sm text-blue-900">
                  <p className="font-semibold mb-1">Billing Terms:</p>
                  <p>
                    Month-to-month subscription. Cancel anytime. You'll still pay for the full month
                    if not canceled by the 1st, or if already billed. No refunds for partial months.
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-4">
              <Button
                onClick={handleSubscribe}
                disabled={isLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  `Subscribe to ${selectedPlanDetails?.name} - $${price}${selectedInterval === 'year' ? '/year' : '/month'}`
                )}
              </Button>
              <Button
                onClick={handleSetupLater}
                disabled={isLoading}
                variant="outline"
                className="px-8 py-3"
              >
                Setup Later
              </Button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              By subscribing, you agree to our Terms of Service and Privacy Policy.
              You can cancel your subscription at any time from the billing settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
