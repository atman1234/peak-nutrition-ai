import { Alert, Platform } from 'react-native'

// Get Stripe publishable key from environment
const stripePublishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY

if (!stripePublishableKey) {
  console.warn('Stripe publishable key not found. Please add EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY to your environment variables.')
}

// Export for components that need it
export { stripePublishableKey }

// Types for Stripe integration (keeping same interface for compatibility)
export interface StripeCheckoutSession {
  sessionId: string
  url: string
  client_secret?: string
}

// Price IDs for different plans (same as original)
export const STRIPE_PRICE_IDS = {
  pro_monthly: 'price_1RwSJpEnIEsHKfvaOGQBwUEb', // Monthly: $9.99 USD Per month
  pro_yearly: 'price_1RwSKgEnIEsHKfvab9kJaz2n',   // Annual: $95.90 USD Per year  
} as const

// Test mode verification
export const isTestMode = () => {
  return stripePublishableKey?.startsWith('pk_test_')
}

// Create a Stripe checkout session via Supabase function (updated for mobile)
export const createCheckoutSession = async (priceId: string, userId: string): Promise<StripeCheckoutSession> => {
  const { supabase } = await import('./supabase')
  
  // Mobile apps use deep links instead of URLs
  const successUrl = 'calorie-tracker://payment-success'
  const cancelUrl = 'calorie-tracker://payment-cancelled'
  
  // Call Supabase function to create Stripe checkout session
  const { data, error } = await supabase.rpc('create_stripe_checkout_session', {
    user_id: userId,
    price_id: priceId,
    success_url: successUrl,
    cancel_url: cancelUrl
  })
  
  if (error) {
    throw new Error(`Failed to create checkout session: ${error.message}`)
  }
  
  if (data.error) {
    throw new Error(`Stripe error: ${data.message}`)
  }
  
  return {
    sessionId: data.id,
    url: data.url,
    client_secret: data.client_secret // For Payment Sheet
  }
}

// Initialize Payment Sheet (React Native specific)
export const initializePaymentSheet = async (
  clientSecret: string,
  customerId?: string,
  customerEphemeralKeySecret?: string
) => {
  // This function will be used by the hook that has access to useStripe
  // We return a configuration object here
  return {
    clientSecret,
    customerId,
    customerEphemeralKeySecret,
    merchantDisplayName: 'Calorie Tracker',
    returnURL: 'calorie-tracker://stripe-redirect',
    applePay: {
      merchantId: 'merchant.com.yourcompany.calorietracker',
    },
    googlePay: {
      merchantId: 'your-google-pay-merchant-id',
      testEnv: isTestMode(),
    },
  }
}

// Stripe configuration for React components
export const getStripeConfig = () => ({
  publishableKey: stripePublishableKey!,
  merchantIdentifier: "merchant.com.yourcompany.calorietracker", // Replace with your actual merchant ID
  urlScheme: "calorie-tracker"
})

// Legacy functions for backward compatibility (will show helpful errors)
export const redirectToCheckout = async (sessionId: string) => {
  if (Platform.OS === 'web') {
    // On web, we could potentially still redirect
    throw new Error('redirectToCheckout is not supported in React Native. Use Payment Sheet instead.')
  } else {
    Alert.alert(
      'Not Supported',
      'Redirect checkout is not supported on mobile. Please use the Payment Sheet flow.',
      [{ text: 'OK' }]
    )
    throw new Error('redirectToCheckout is not supported in React Native. Use Payment Sheet instead.')
  }
}

export const initEmbeddedCheckout = async (sessionId: string) => {
  throw new Error('initEmbeddedCheckout is not supported in React Native. Use Payment Sheet instead.')
}

// Export for legacy compatibility
export const stripePromise = Promise.resolve(null) // Not used in React Native