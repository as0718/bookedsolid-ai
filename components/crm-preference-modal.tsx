'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, CheckCircle2 } from 'lucide-react';

interface CRMPreferenceModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export default function CRMPreferenceModal({ isOpen, onComplete }: CRMPreferenceModalProps) {
  const [selectedOption, setSelectedOption] = useState<'external' | 'builtin' | null>(null);
  const [externalCRMName, setExternalCRMName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/user/crm-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hasExternalCRM: selectedOption === 'external',
          preferredCRM: selectedOption === 'external' ? externalCRMName : null,
          crmPreference: selectedOption === 'external' ? 'EXTERNAL_CRM' : 'BOOKEDSOLID_CRM',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save CRM preference');
      }

      // Close modal and refresh
      onComplete();
    } catch (error) {
      console.error('CRM preference error:', error);
      setError(error instanceof Error ? error.message : 'Failed to save preference');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = selectedOption === 'builtin' || (selectedOption === 'external' && externalCRMName.trim());

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full">
        <div className="p-6">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mb-4">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-2">Welcome to BookedSolid! 👋</h2>
            <p className="text-gray-600 text-lg mb-1">
              Let's get you set up in just 2 quick steps
            </p>
            <p className="text-gray-500 text-sm">
              Step 1 of 2: CRM Selection
            </p>
          </div>

          <div className="grid gap-4 mb-6">
            {/* Option 1: Has External CRM */}
            <Card
              className={`cursor-pointer transition-all ${
                selectedOption === 'external'
                  ? 'border-purple-500 border-2 shadow-lg bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedOption('external')}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">Yes, I use my own CRM</CardTitle>
                    <CardDescription className="mt-1">
                      I already have a CRM system (Square, Fresha, Mindbody, etc.)
                    </CardDescription>
                  </div>
                  {selectedOption === 'external' && (
                    <CheckCircle2 className="w-6 h-6 text-purple-600 flex-shrink-0" />
                  )}
                </div>
              </CardHeader>
              {selectedOption === 'external' && (
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="crmName">Which CRM do you use?</Label>
                    <Input
                      id="crmName"
                      placeholder="e.g., Square, Fresha, Mindbody, Salesforce..."
                      value={externalCRMName}
                      onChange={(e) => setExternalCRMName(e.target.value)}
                      className="w-full"
                      autoFocus
                    />
                    <p className="text-xs text-gray-500">
                      The CRM tab will be hidden from your dashboard since you're managing clients elsewhere.
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Option 2: Needs Built-in CRM */}
            <Card
              className={`cursor-pointer transition-all ${
                selectedOption === 'builtin'
                  ? 'border-purple-500 border-2 shadow-lg bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedOption('builtin')}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">No, I need a CRM system</CardTitle>
                    <CardDescription className="mt-1">
                      Enable BookedSolid's built-in CRM to manage clients and appointments
                    </CardDescription>
                  </div>
                  {selectedOption === 'builtin' && (
                    <CheckCircle2 className="w-6 h-6 text-purple-600 flex-shrink-0" />
                  )}
                </div>
              </CardHeader>
              {selectedOption === 'builtin' && (
                <CardContent>
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
                        <p className="font-semibold mb-1">Built-in CRM Features:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Client contact management</li>
                          <li>Appointment scheduling and tracking</li>
                          <li>Service history and notes</li>
                          <li>Automatic call integration</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-4">
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 text-lg"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                'Continue to Plan Selection →'
              )}
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center mt-4">
            You can change this preference later in your settings.
          </p>
        </div>
      </div>
    </div>
  );
}
