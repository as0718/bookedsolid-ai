'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface StripeErrorBoundaryProps {
  children: React.ReactNode;
  showWarning?: boolean;
}

export default function StripeErrorBoundary({ children, showWarning = true }: StripeErrorBoundaryProps) {
  const [isConfigured, setIsConfigured] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Check if Stripe publishable key is available (safe to check on client)
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey || publishableKey.includes('REPLACE_WITH_YOUR_KEY')) {
      setIsConfigured(false);
    }
  }, []);

  if (!isConfigured && showWarning) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="text-yellow-800 flex items-center gap-2">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            Stripe Configuration Required
          </CardTitle>
          <CardDescription className="text-yellow-700">
            Billing features are currently unavailable due to missing Stripe configuration.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-yellow-800">
            <p className="font-semibold mb-2">To enable billing features:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Get your Stripe API keys from the{' '}
                <a
                  href="https://dashboard.stripe.com/apikeys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-yellow-900"
                >
                  Stripe Dashboard
                </a>
              </li>
              <li>Add STRIPE_SECRET_KEY to your environment variables</li>
              <li>Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to your environment variables</li>
              <li>Create subscription products and add price IDs</li>
              <li>Restart your application</li>
            </ol>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="text-yellow-800 border-yellow-300 hover:bg-yellow-100"
          >
            {showDetails ? 'Hide' : 'Show'} Setup Details
          </Button>

          {showDetails && (
            <div className="bg-yellow-100 p-4 rounded-lg text-xs font-mono space-y-2">
              <p className="font-semibold text-yellow-900">Required Environment Variables:</p>
              <div className="text-yellow-800 space-y-1">
                <p>STRIPE_SECRET_KEY=sk_test_your_key_here</p>
                <p>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here</p>
                <p>STRIPE_WEBHOOK_SECRET=whsec_your_secret_here</p>
                <p className="mt-2 font-semibold">Price IDs (create in Stripe):</p>
                <p>STRIPE_PRICE_MISSED_MONTHLY=price_xxx</p>
                <p>STRIPE_PRICE_MISSED_ANNUAL=price_xxx</p>
                <p>STRIPE_PRICE_COMPLETE_MONTHLY=price_xxx</p>
                <p>STRIPE_PRICE_COMPLETE_ANNUAL=price_xxx</p>
                <p>STRIPE_PRICE_UNLIMITED_MONTHLY=price_xxx</p>
                <p>STRIPE_PRICE_UNLIMITED_ANNUAL=price_xxx</p>
              </div>
            </div>
          )}

          <div className="text-xs text-yellow-700 bg-yellow-100 p-3 rounded">
            <strong>Note:</strong> You can continue using the dashboard without billing setup,
            but subscription management features will not be available.
          </div>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}
