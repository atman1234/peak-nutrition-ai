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

export const useStripe = () => useContext(StripeContext);

// Mock CardField for web - you can implement a proper web form here
export const CardField = ({ onCardChange, ...props }) => {
  return (
    <div style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}>
      Stripe Card Input - Web Version (implement with Stripe Elements)
    </div>
  );
};