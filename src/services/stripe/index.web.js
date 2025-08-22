// Web implementation using Stripe.js
import React, { createContext, useContext } from 'react';
import { loadStripe } from '@stripe/stripe-js';

const StripeContext = createContext(null);

export const StripeProvider = ({ children, publishableKey }) => {
  const [stripe, setStripe] = React.useState(null);
  
  React.useEffect(() => {
    loadStripe(publishableKey).then(setStripe);
  }, [publishableKey]);
  
  return (
    <StripeContext.Provider value={stripe}>
      {children}
    </StripeContext.Provider>
  );
};

export const useStripe = () => {
  const stripe = useContext(StripeContext);
  
  // Return an object that matches the native interface
  return {
    initPaymentSheet: async () => ({ error: null }),
    presentPaymentSheet: async () => ({ error: null }),
    stripe
  };
};

// Mock CardField for web - you can implement a proper web form here
export const CardField = ({ onCardChange, ...props }) => {
  return (
    <div style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}>
      Stripe Card Input - Web Version (implement with Stripe Elements)
    </div>
  );
};