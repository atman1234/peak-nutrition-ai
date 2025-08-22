import { useState } from 'react'
import { Alert } from 'react-native'
import { useStripe } from '../services/stripe'
import { useAuthContext } from '../components/auth/AuthContext'
import { createCheckoutSession, STRIPE_PRICE_IDS, initializePaymentSheet } from '../lib/stripe'

export type BillingPeriod = 'monthly' | 'yearly'

export function useStripeCheckout() {
  const { user } = useAuthContext()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { initPaymentSheet, presentPaymentSheet } = useStripe()

  const initiateCheckout = async (plan: 'pro', billingPeriod: BillingPeriod = 'monthly') => {
    if (!user?.id) {
      setError('User not authenticated')
      return false
    }

    setIsLoading(true)
    setError(null)

    try {
      // Get the price ID based on plan and billing period
      const priceId = billingPeriod === 'yearly' 
        ? STRIPE_PRICE_IDS.pro_yearly 
        : STRIPE_PRICE_IDS.pro_monthly

      // Create Stripe checkout session via Supabase
      const session = await createCheckoutSession(priceId, user.id)

      if (!session.client_secret) {
        throw new Error('No client secret received from payment session')
      }

      // Get payment sheet configuration
      const paymentSheetConfig = await initializePaymentSheet(session.client_secret)

      // Initialize the payment sheet
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: paymentSheetConfig.merchantDisplayName,
        paymentIntentClientSecret: session.client_secret,
        returnURL: paymentSheetConfig.returnURL,
        applePay: paymentSheetConfig.applePay,
        googlePay: paymentSheetConfig.googlePay,
      })

      if (initError) {
        throw new Error(initError.message)
      }

      // Present the payment sheet
      const { error: presentError } = await presentPaymentSheet()

      if (presentError) {
        // User cancelled is not an error we want to show
        if (presentError.code !== 'Canceled') {
          throw new Error(presentError.message)
        }
        return false
      }

      // Payment successful!
      Alert.alert(
        'Payment Successful!', 
        'Your subscription is now active. Thank you for upgrading to Pro!',
        [{ text: 'OK' }]
      )
      
      return true

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process payment'
      setError(errorMessage)
      
      Alert.alert(
        'Payment Error',
        errorMessage,
        [{ text: 'OK' }]
      )
      
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return {
    initiateCheckout,
    isLoading,
    error,
  }
}