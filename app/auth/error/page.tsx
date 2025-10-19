'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const errorParam = searchParams.get('error');
    setError(errorParam);
  }, [searchParams]);

  const getErrorMessage = (errorCode: string | null) => {
    switch (errorCode) {
      case 'OAuthSignin':
        return {
          title: 'OAuth Sign-In Error',
          description: 'There was an error communicating with the OAuth provider. Please try again.',
          details: 'This usually happens when the OAuth configuration is incorrect or the redirect URI is not authorized.'
        };
      case 'OAuthCallback':
        return {
          title: 'OAuth Callback Error',
          description: 'There was an error processing the OAuth callback.',
          details: 'Please check that your redirect URIs are correctly configured in your OAuth provider settings.'
        };
      case 'OAuthCreateAccount':
        return {
          title: 'Account Creation Error',
          description: 'Could not create your account with the OAuth provider.',
          details: 'Please try again or contact support if the issue persists.'
        };
      case 'EmailCreateAccount':
        return {
          title: 'Email Account Creation Error',
          description: 'Could not create an account with this email address.',
          details: 'This email may already be in use or there may be a validation issue.'
        };
      case 'Callback':
        return {
          title: 'Callback Error',
          description: 'There was an error processing your sign-in request.',
          details: 'Please try signing in again.'
        };
      case 'OAuthAccountNotLinked':
        return {
          title: 'Account Not Linked',
          description: 'This email is already associated with another account.',
          details: 'Please sign in using the original authentication method, or use a different email address.'
        };
      case 'EmailSignin':
        return {
          title: 'Email Sign-In Error',
          description: 'Could not send sign-in email.',
          details: 'Please check your email address and try again.'
        };
      case 'CredentialsSignin':
        return {
          title: 'Invalid Credentials',
          description: 'The email or password you entered is incorrect.',
          details: 'Please check your credentials and try again.'
        };
      case 'SessionRequired':
        return {
          title: 'Session Required',
          description: 'You need to be signed in to access this page.',
          details: 'Please sign in to continue.'
        };
      default:
        return {
          title: 'Authentication Error',
          description: 'An unexpected error occurred during authentication.',
          details: error ? `Error code: ${error}` : 'Please try again.'
        };
    }
  };

  const errorInfo = getErrorMessage(error);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="max-w-md w-full border-red-200 shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 text-red-600 mb-2">
            <svg
              className="w-6 h-6"
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
            <CardTitle className="text-2xl">{errorInfo.title}</CardTitle>
          </div>
          <CardDescription className="text-base text-gray-700">
            {errorInfo.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{errorInfo.details}</p>
          </div>

          {error === 'OAuthSignin' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900 font-semibold mb-2">
                Common Solutions:
              </p>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Check that your Google OAuth redirect URI is correct</li>
                <li>Verify your OAuth credentials are up to date</li>
                <li>Ensure NEXTAUTH_URL matches your deployment URL</li>
              </ul>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button
              onClick={() => window.location.href = '/login'}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Return to Login
            </Button>
            <Button
              onClick={() => window.location.href = '/'}
              variant="outline"
              className="w-full"
            >
              Go to Home
            </Button>
          </div>

          <div className="text-xs text-gray-500 text-center pt-2">
            Need help? Contact support or check the documentation
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
}
