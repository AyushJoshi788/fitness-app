// PAYMENT_INTEGRATION_GUIDE.md

# Payment Integration Guide: Razorpay & Stripe

## 💳 Payment Flow Architecture

```
User selects Premium Plan
        ↓
Frontend shows Payment UI
        ↓
User enters payment details (secured)
        ↓
Payment Gateway processes (Razorpay/Stripe)
        ↓
Frontend receives success/failure callback
        ↓
Frontend calls Backend API to verify
        ↓
Backend verifies payment with gateway
        ↓
Backend updates Firestore subscription status
        ↓
Frontend shows success → User gets premium access
```

---

## 🎯 Razorpay Integration (Recommended for India)

### Step 1: Setup Razorpay Account

1. Go to [razorpay.com](https://razorpay.com)
2. Sign up → Complete KYC
3. Dashboard → API Keys
4. Copy **Key ID** and **Key Secret**

### Step 2: Install Razorpay SDK

```bash
npm install razorpay
```

### Step 3: Frontend Payment Component

```typescript
// src/premium/RazorpayPaymentPanel.tsx
import React, { useState } from 'react';
import { useAuth } from '../auth/useAuth';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const RazorpayPaymentPanel: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const initiatePayment = async (planType: 'monthly' | 'yearly') => {
    try {
      setLoading(true);
      setError('');

      // Step 1: Create payment order from backend
      const response = await fetch('/api/create-razorpay-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          planType,
          amount: planType === 'monthly' ? 49900 : 399900, // in paise (divide by 100 for INR)
        }),
      });

      const { orderId, amount } = await response.json();

      // Step 2: Open Razorpay modal
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: amount,
        currency: 'INR',
        name: 'FitAI',
        description: `Premium ${planType} Subscription`,
        order_id: orderId,
        prefill: {
          email: user.email,
          contact: '9999999999', // Get from user if available
        },
        handler: async (response: any) => {
          // Step 3: Verify payment on backend
          await verifyPayment(response, planType);
        },
        modal: {
          ondismiss: () => {
            setError('Payment cancelled');
            setLoading(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  };

  const verifyPayment = async (
    response: any,
    planType: 'monthly' | 'yearly'
  ) => {
    try {
      // Verify on backend
      const verifyResponse = await fetch('/api/verify-razorpay-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          userId: user.id,
          planType,
        }),
      });

      const { success } = await verifyResponse.json();

      if (success) {
        // Payment verified! Update user subscription
        const expiryDate = new Date();
        expiryDate.setMonth(
          expiryDate.getMonth() + (planType === 'yearly' ? 12 : 1)
        );

        await updateProfile({
          subscriptionStatus: 'premium',
          premiumExpiresAt: expiryDate,
        });

        alert('🎉 Premium activated! Enjoy all features');
        setLoading(false);
      } else {
        setError('Payment verification failed');
        setLoading(false);
      }
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  };

  return (
    <div className="payment-panel">
      <h2>Upgrade to Premium</h2>

      {error && <div className="error">{error}</div>}

      <div className="pricing-cards">
        {/* Monthly Plan */}
        <div className="plan-card">
          <h3>Monthly</h3>
          <p className="price">₹499/month</p>
          <ul>
            <li>All premium features</li>
            <li>Cancel anytime</li>
          </ul>
          <button
            onClick={() => initiatePayment('monthly')}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Processing...' : 'Buy Monthly'}
          </button>
        </div>

        {/* Yearly Plan */}
        <div className="plan-card featured">
          <div className="badge">Save 17%</div>
          <h3>Yearly</h3>
          <p className="price">₹3,999/year</p>
          <ul>
            <li>All premium features</li>
            <li>Best value</li>
            <li>Save ₹1,000</li>
          </ul>
          <button
            onClick={() => initiatePayment('yearly')}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Processing...' : 'Buy Yearly'}
          </button>
        </div>
      </div>
    </div>
  );
};
```

### Step 4: Backend Payment Verification (Node.js/Express)

```typescript
// backend/routes/payment.ts (pseudocode)
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { db } from './firebaseConfig';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const createRazorpayOrder = async (req, res) => {
  try {
    const { amount, planType, userId, email } = req.body;

    // Create order
    const options = {
      amount: amount, // in paise
      currency: 'INR',
      receipt: `fitai_${userId}_${Date.now()}`,
      notes: {
        userId,
        planType,
        email,
      },
    };

    const order = await razorpay.orders.create(options);

    // Save pending order to Firestore
    await db.collection('subscriptions').add({
      userId,
      orderId: order.id,
      amount,
      planType,
      status: 'pending',
      createdAt: new Date(),
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, planType } = req.body;

    // Verify signature
    const hmac = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const isAuthentic = hmac === razorpay_signature;

    if (!isAuthentic) {
      return res.json({ success: false, message: 'Invalid signature' });
    }

    // Payment verified! Update subscription in Firestore
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + (planType === 'yearly' ? 12 : 1));

    await db.collection('users').doc(userId).update({
      subscriptionStatus: 'premium',
      premiumExpiresAt: expiryDate,
      premiumActivatedAt: new Date(),
    });

    // Log subscription
    await db.collection('subscriptions').add({
      userId,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      planType,
      amount: parseInt(req.body.amount),
      status: 'completed',
      activatedAt: new Date(),
      expiresAt: expiryDate,
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

---

## 💳 Stripe Integration (Global)

### Step 1: Setup Stripe Account

1. Go to [stripe.com](https://stripe.com)
2. Create account → Get API keys
3. Dashboard → API Keys
4. Copy **Publishable Key** and **Secret Key**

### Step 2: Install Stripe SDK

```bash
npm install @stripe/react-stripe-js @stripe/js
```

### Step 3: Frontend Stripe Component

```typescript
// src/premium/StripePaymentPanel.tsx
import React, { useState } from 'react';
import { loadStripe } from '@stripe/js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useAuth } from '../auth/useAuth';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface CheckoutFormProps {
  amount: number;
  planType: 'monthly' | 'yearly';
  onSuccess: () => void;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ amount, planType, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setLoading(true);
    setError('');

    try {
      // Step 1: Create payment intent on backend
      const response = await fetch('/api/create-stripe-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          amount,
          planType,
        }),
      });

      const { clientSecret } = await response.json();

      // Step 2: Confirm payment with Stripe
      const cardElement = elements.getElement(CardElement);
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: { email: user.email },
        },
      });

      if (result.error) {
        setError(result.error.message);
        setLoading(false);
        return;
      }

      // Step 3: Payment succeeded, update subscription
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + (planType === 'yearly' ? 12 : 1));

      await updateProfile({
        subscriptionStatus: 'premium',
        premiumExpiresAt: expiryDate,
      });

      alert('🎉 Premium activated!');
      onSuccess();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      {error && <p className="error">{error}</p>}
      <button disabled={!stripe || loading}>
        {loading ? 'Processing...' : `Pay $${(amount / 100).toFixed(2)}`}
      </button>
    </form>
  );
};

export const StripePaymentPanel: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <div className="payment-panel">
      <h2>Upgrade to Premium</h2>

      <Elements stripe={stripePromise}>
        <CheckoutForm
          amount={selectedPlan === 'monthly' ? 499 : 3999} // in cents
          planType={selectedPlan}
          onSuccess={() => {
            // Handle success
          }}
        />
      </Elements>

      <div className="plan-selector">
        <button
          onClick={() => setSelectedPlan('monthly')}
          className={selectedPlan === 'monthly' ? 'active' : ''}
        >
          Monthly - $4.99
        </button>
        <button
          onClick={() => setSelectedPlan('yearly')}
          className={selectedPlan === 'yearly' ? 'active' : ''}
        >
          Yearly - $39.99 (Save 33%)
        </button>
      </div>
    </div>
  );
};
```

---

## 🔄 Payment Verification Flow

### Server-Side Verification Concept

```
Client sends payment confirmation
        ↓
Backend receives: paymentId, amount, orderId
        ↓
Backend queries payment gateway: "Is this payment real?"
        ↓
Payment Gateway responds: "Yes, verified ✓" or "No, fraudulent ✗"
        ↓
If verified:
  - Update Firestore user subscription
  - Log payment in subscriptions collection
  - Send confirmation email
        ↓
If not verified:
  - Reject request
  - Log fraud attempt
  - Alert admin
```

### Why Server-Side Verification?

- ✅ Client can't forge payment confirmations
- ✅ Payment gateway confirms authenticity
- ✅ Fraud prevention
- ✅ PCI compliance (never store card data)

---

## 🔐 Premium Status After Payment

### Automatic Premium Access

```typescript
// Update user with subscription expiry
await updateProfile({
  subscriptionStatus: 'premium',
  premiumExpiresAt: futureDate,  // Set to 1 month or 1 year from now
});

// Frontend checks subscription status
const isPremium = user?.subscriptionStatus === 'premium' && 
                  user?.premiumExpiresAt > new Date();

// Show premium features conditionally
{isPremium && <PremiumFeature />}
```

### Checking Premium Status

```typescript
// In any component
const { user } = useAuth();

const isPremiumActive = () => {
  if (!user) return false;
  if (user.subscriptionStatus !== 'premium') return false;
  if (!user.premiumExpiresAt) return false;
  
  return new Date(user.premiumExpiresAt) > new Date();
};

// Usage
if (isPremiumActive()) {
  // Show premium content
} else {
  // Show upgrade prompt
}
```

### Subscription Expiry Check

```typescript
// Run on app load
useEffect(() => {
  const checkSubscriptionExpiry = async () => {
    if (!user?.premiumExpiresAt) return;

    const expiryDate = new Date(user.premiumExpiresAt);
    const now = new Date();

    if (expiryDate < now) {
      // Subscription expired!
      await updateProfile({ subscriptionStatus: 'free' });
      // Show renewal prompt
    }
  };

  checkSubscriptionExpiry();
}, [user]);
```

---

## 🎁 QR-Based Demo Activation

### Generate Demo Token

```typescript
// src/premium/AdminGenerator.tsx
const generateDemoQR = async () => {
  const demoToken = {
    type: 'premium_demo',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    code: Math.random().toString(36).substring(2, 10).toUpperCase(),
  };

  // Store in Firestore for verification
  await db.collection('demo_tokens').add(demoToken);

  // Generate QR code
  QRCode.toDataURL(JSON.stringify(demoToken), (err, url) => {
    // Display QR code image
  });
};
```

### Activate Premium via QR

```typescript
// User scans QR → gets demo token
const activatePremiumDemo = async (demoCode: string) => {
  const token = await db
    .collection('demo_tokens')
    .where('code', '==', demoCode)
    .get();

  if (token.empty || new Date(token.docs[0].data().expiresAt) < new Date()) {
    throw new Error('Invalid or expired demo code');
  }

  // Grant 7-day premium
  await updateProfile({
    subscriptionStatus: 'premium',
    premiumExpiresAt: token.docs[0].data().expiresAt,
  });
};
```

---

## 📊 Payment Status Tracking

```typescript
interface PaymentRecord {
  userId: string;
  transactionId: string;
  paymentGateway: 'razorpay' | 'stripe';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  planType: 'monthly' | 'yearly';
  activatedAt: Date;
  expiresAt: Date;
  createdAt: Date;
}
```

---

## ✅ Checklist

- [ ] Payment gateway account created (Razorpay/Stripe)
- [ ] API keys added to `.env.local`
- [ ] Payment component created
- [ ] Backend verification logic implemented
- [ ] Subscription status updated on payment
- [ ] Premium expiry checked on app load
- [ ] Demo QR code generation implemented
- [ ] Error handling added
- [ ] Test payment flow end-to-end
- [ ] Monitor failed payments

---

## 🧪 Testing

### Razorpay Test Mode
- Use test orders (no real payment)
- Dashboard → Settings → Test/Live keys
- Use test card: 4111 1111 1111 1111

### Stripe Test Mode
- Test card: 4242 4242 4242 4242
- Exp: Any future date
- CVC: Any 3 digits
