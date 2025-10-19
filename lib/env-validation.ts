/**
 * Environment Variable Validation
 *
 * This module validates required environment variables and provides
 * helpful error messages for missing or misconfigured values.
 */

export interface EnvValidationResult {
  isValid: boolean;
  missing: string[];
  warnings: string[];
}

/**
 * Required environment variables for core functionality
 */
const REQUIRED_ENV_VARS = [
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
  'DATABASE_URL',
] as const;

/**
 * Optional but recommended environment variables
 */
const OPTIONAL_ENV_VARS = {
  STRIPE_SECRET_KEY: 'Stripe payments will not work without this',
  STRIPE_PUBLISHABLE_KEY: 'Stripe checkout will not work without this',
  GOOGLE_CLIENT_ID: 'Google OAuth login will not be available',
  GOOGLE_CLIENT_SECRET: 'Google OAuth login will not be available',
} as const;

/**
 * Validates that all required environment variables are set
 */
export function validateRequiredEnv(): EnvValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  for (const envVar of REQUIRED_ENV_VARS) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  // Check optional variables and add warnings
  for (const [envVar, message] of Object.entries(OPTIONAL_ENV_VARS)) {
    if (!process.env[envVar] || process.env[envVar]?.includes('REPLACE_WITH_YOUR')) {
      warnings.push(`${envVar}: ${message}`);
    }
  }

  return {
    isValid: missing.length === 0,
    missing,
    warnings,
  };
}

/**
 * Validates Stripe-specific environment variables
 */
export function validateStripeEnv(): EnvValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];

  const stripeVars = [
    'STRIPE_SECRET_KEY',
    'STRIPE_PUBLISHABLE_KEY',
    'STRIPE_WEBHOOK_SECRET',
  ];

  for (const envVar of stripeVars) {
    const value = process.env[envVar];
    if (!value || value.includes('REPLACE_WITH_YOUR')) {
      missing.push(envVar);
    }
  }

  // Check price IDs
  const priceIds = [
    'STRIPE_PRICE_MISSED_MONTHLY',
    'STRIPE_PRICE_MISSED_ANNUAL',
    'STRIPE_PRICE_COMPLETE_MONTHLY',
    'STRIPE_PRICE_COMPLETE_ANNUAL',
    'STRIPE_PRICE_UNLIMITED_MONTHLY',
    'STRIPE_PRICE_UNLIMITED_ANNUAL',
  ];

  for (const priceId of priceIds) {
    const value = process.env[priceId];
    if (!value || value.includes('REPLACE_WITH_YOUR')) {
      warnings.push(`${priceId}: Subscription plans will not work without price IDs`);
    }
  }

  return {
    isValid: missing.length === 0,
    missing,
    warnings,
  };
}

/**
 * Logs validation results to console with helpful formatting
 */
export function logValidationResults(result: EnvValidationResult, context: string = 'Environment') {
  if (!result.isValid) {
    console.error(`\n❌ ${context} Validation Failed`);
    console.error('Missing required variables:');
    result.missing.forEach(v => console.error(`  - ${v}`));
  }

  if (result.warnings.length > 0) {
    console.warn(`\n⚠️  ${context} Warnings:`);
    result.warnings.forEach(w => console.warn(`  - ${w}`));
  }

  if (result.isValid && result.warnings.length === 0) {
    console.log(`✅ ${context} validation passed`);
  }
}

/**
 * Validates environment on server startup (optional, can be called in middleware)
 */
export function validateEnvOnStartup() {
  if (typeof window !== 'undefined') {
    // Skip validation on client side
    return;
  }

  const coreResult = validateRequiredEnv();
  logValidationResults(coreResult, 'Core Environment');

  const stripeResult = validateStripeEnv();
  logValidationResults(stripeResult, 'Stripe Configuration');

  return {
    core: coreResult,
    stripe: stripeResult,
  };
}
