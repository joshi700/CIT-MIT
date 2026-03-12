import { useState, useEffect, useCallback } from 'react';
import { useSession } from '../../context/SessionContext';
import {
  createHostedSession,
  initiateSubscription,
  authenticatePayer,
  completeSubscription,
  getGatewayConfig,
} from '../../utils/api';
import './Acts.css';

export default function Act1CIT() {
  const { state, dispatch, addApiLogs } = useSession();
  const [step, setStep] = useState('landing'); // landing | checkout | threeds | authorizing | complete
  const [consent, setConsent] = useState(false);
  const [hostedSessionReady, setHostedSessionReady] = useState(false);
  const [gatewayConfig, setGatewayConfig] = useState(null);
  const [error, setError] = useState(null);
  const [threeDSHtml, setThreeDSHtml] = useState(null);
  const [orderData, setOrderData] = useState(null);

  // Load gateway config on mount
  useEffect(() => {
    getGatewayConfig().then(setGatewayConfig).catch(console.error);
  }, []);

  const updateStep = useCallback((newStep) => {
    setStep(newStep);
    const stepMap = { landing: 0, checkout: 1, threeds: 2, authorizing: 3, complete: 4 };
    dispatch({ type: 'SET_STEP', payload: stepMap[newStep] || 0 });
  }, [dispatch]);

  // Initialize Hosted Session
  const initHostedSession = async () => {
    try {
      setError(null);
      dispatch({ type: 'SET_LOADING', payload: true });

      const result = await createHostedSession(state.demoSessionId);
      dispatch({ type: 'SET_GATEWAY_SESSION', payload: result.gatewaySessionId });
      addApiLogs(result.apiLog);

      // Load Mastercard session.js and configure hosted fields
      if (gatewayConfig && window.PaymentSession) {
        configureHostedSession(result.gatewaySessionId);
      } else {
        // session.js loaded via script tag - wait for it
        setHostedSessionReady(true);
      }

      updateStep('checkout');
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const configureHostedSession = (sessionId) => {
    if (!window.PaymentSession) return;

    window.PaymentSession.configure({
      session: sessionId,
      fields: {
        card: {
          number: '#card-number',
          securityCode: '#card-cvv',
          expiryMonth: '#card-expiry-month',
          expiryYear: '#card-expiry-year',
        },
      },
      frameEmbeddingMitigation: ['javascript'],
      callbacks: {
        initialized: (response) => {
          console.log('Hosted Session initialized:', response);
          setHostedSessionReady(true);
        },
        formSessionUpdate: (response) => {
          if (response.status === 'ok') {
            console.log('Session updated with card data');
            handlePostCardSubmit();
          } else {
            setError('Failed to update session with card data: ' + JSON.stringify(response.errors));
          }
        },
      },
    });
  };

  // Submit card data via Hosted Session
  const handlePayClick = () => {
    if (!consent) {
      setError('Please check the consent box to store your card details.');
      return;
    }
    setError(null);

    if (window.PaymentSession) {
      window.PaymentSession.updateSessionFromForm('card');
    } else {
      // If session.js not loaded, proceed directly (sandbox fallback)
      handlePostCardSubmit();
    }
  };

  // After card data is tokenized into session, initiate 3DS
  const handlePostCardSubmit = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_CONSENT', payload: true });
      updateStep('threeds');

      const gatewaySessionId = state.gatewaySessionId;
      const result = await initiateSubscription(state.demoSessionId, gatewaySessionId);
      addApiLogs(result.apiLogs);
      setOrderData(result);

      // Now authenticate payer (3DS challenge)
      const authResult = await authenticatePayer(
        state.demoSessionId,
        result.orderId,
        result.authTransactionId,
        result.gatewaySessionId
      );
      addApiLogs(authResult.apiLog);

      if (authResult.authenticationData?.authentication?.redirect?.html) {
        setThreeDSHtml(authResult.authenticationData.authentication.redirect.html);
      } else {
        // Frictionless flow or sandbox - proceed directly
        handleThreeDSComplete();
      }

      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
      dispatch({ type: 'SET_LOADING', payload: false });
      // Still allow continuing in sandbox mode
      handleThreeDSComplete();
    }
  };

  // Listen for 3DS callback
  useEffect(() => {
    const handler = (event) => {
      if (event.data?.type === '3DS_CALLBACK') {
        handleThreeDSComplete();
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [state.demoSessionId]);

  // Complete 3DS and authorize
  const handleThreeDSComplete = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_3DS_COMPLETE' });
      updateStep('authorizing');
      setThreeDSHtml(null);

      const result = await completeSubscription(state.demoSessionId);
      addApiLogs(result.apiLogs);

      dispatch({
        type: 'SET_SUBSCRIPTION_COMPLETE',
        payload: { token: result.token, agreementId: result.agreementId },
      });
      dispatch({ type: 'ADD_TRANSACTION', payload: result.transaction });

      updateStep('complete');
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Render based on step
  if (step === 'landing') {
    return (
      <div className="act-content">
        <div className="act-header">
          <span className="badge badge-cit">ACT 1 — CIT</span>
          <h2>Subscribe to Monthly Plan</h2>
          <p className="act-subtitle">Cardholder Initiated Transaction with 3DS Authentication</p>
        </div>

        <div className="subscription-card">
          <div className="plan-badge">Monthly Plan</div>
          <div className="plan-price">
            <span className="plan-currency">$</span>
            <span className="plan-amount">9.99</span>
            <span className="plan-interval">/month</span>
          </div>
          <ul className="plan-features">
            <li>Full access to all content</li>
            <li>Cancel anytime</li>
            <li>Automatic monthly renewal</li>
          </ul>

          <div className="plan-cof-notice">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
              <line x1="1" y1="10" x2="23" y2="10" />
            </svg>
            <span>Your card details will be securely stored for automatic recurring payments</span>
          </div>

          <button className="btn btn-primary btn-lg" onClick={initHostedSession} disabled={state.loading}>
            {state.loading ? 'Setting up...' : 'Subscribe Now'}
          </button>
        </div>
      </div>
    );
  }

  if (step === 'checkout') {
    return (
      <div className="act-content">
        <div className="act-header">
          <span className="badge badge-cit">ACT 1 — CIT</span>
          <h2>Secure Checkout</h2>
          <p className="act-subtitle">Card details collected via Mastercard Hosted Session</p>
        </div>

        <div className="checkout-card">
          <div className="checkout-secure-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Secure — Card data handled by Mastercard Gateway
          </div>

          <div className="checkout-summary">
            <span>Monthly Subscription</span>
            <span className="checkout-amount">$9.99/mo</span>
          </div>

          <div className="form-group">
            <label>Cardholder Name</label>
            <input type="text" className="form-input" placeholder="John Doe" defaultValue="Test Cardholder" />
          </div>

          <div className="form-group">
            <label>Card Number</label>
            <div id="card-number" className="hosted-field">
              <input type="text" className="form-input" placeholder="5123 4500 0000 0008" defaultValue="5123450000000008" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Expiry Month</label>
              <div id="card-expiry-month" className="hosted-field">
                <input type="text" className="form-input" placeholder="01" defaultValue="01" />
              </div>
            </div>
            <div className="form-group">
              <label>Expiry Year</label>
              <div id="card-expiry-year" className="hosted-field">
                <input type="text" className="form-input" placeholder="39" defaultValue="39" />
              </div>
            </div>
            <div className="form-group">
              <label>CVV</label>
              <div id="card-cvv" className="hosted-field">
                <input type="text" className="form-input" placeholder="100" defaultValue="100" />
              </div>
            </div>
          </div>

          <label className="consent-checkbox">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <span>I agree to store my card details for future recurring payments. I understand that my card will be charged $9.99/month automatically until I cancel.</span>
          </label>

          {error && <div className="error-message">{error}</div>}

          <button className="btn btn-primary btn-lg" onClick={handlePayClick} disabled={state.loading || !consent}>
            {state.loading ? 'Processing...' : 'Pay $9.99/month'}
          </button>

          <div className="checkout-hosted-note">
            <code>PaymentSession.updateSessionFromForm('card')</code> tokenizes card data into the gateway session
          </div>
        </div>
      </div>
    );
  }

  if (step === 'threeds') {
    return (
      <div className="act-content">
        <div className="act-header">
          <span className="badge badge-cit">ACT 1 — CIT</span>
          <h2>3D Secure Authentication</h2>
          <p className="act-subtitle">Cardholder verifies identity with the card issuer</p>
        </div>

        <div className="threeds-card">
          {threeDSHtml ? (
            <div
              className="threeds-frame"
              dangerouslySetInnerHTML={{ __html: threeDSHtml }}
            />
          ) : state.loading ? (
            <div className="threeds-loading">
              <div className="spinner" />
              <p>Initiating 3DS Authentication...</p>
              <p className="threeds-sub">The issuer is verifying this transaction</p>
            </div>
          ) : (
            <div className="threeds-simulated">
              <div className="threeds-issuer-badge">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                Issuer Authentication
              </div>
              <h3>Verify Your Identity</h3>
              <p>A one-time password has been sent to your registered mobile number.</p>
              <div className="form-group">
                <label>Enter OTP</label>
                <input type="text" className="form-input" placeholder="123456" defaultValue="123456" />
              </div>
              <button className="btn btn-primary" onClick={handleThreeDSComplete} disabled={state.loading}>
                {state.loading ? 'Verifying...' : 'Verify & Pay'}
              </button>
              <p className="threeds-note">This simulates the 3DS challenge flow from the card issuer (ACS)</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (step === 'authorizing') {
    return (
      <div className="act-content">
        <div className="act-header">
          <span className="badge badge-cit">ACT 1 — CIT</span>
          <h2>Processing Payment</h2>
          <p className="act-subtitle">Authorizing, capturing, and tokenizing credentials</p>
        </div>

        <div className="processing-card">
          <div className="processing-steps">
            <div className="processing-step done">
              <div className="processing-step-icon">✓</div>
              <div>
                <strong>3DS Authentication</strong>
                <p>Cardholder verified</p>
              </div>
            </div>
            <div className="processing-step active">
              <div className="spinner-small" />
              <div>
                <strong>Authorization (CIT)</strong>
                <p>credentialOnFile: FIRST_STORED, initiator: CARDHOLDER</p>
              </div>
            </div>
            <div className="processing-step pending">
              <div className="processing-step-icon">○</div>
              <div>
                <strong>Tokenize Card</strong>
                <p>Store credential-on-file for future MIT</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'complete') {
    return (
      <div className="act-content">
        <div className="act-header">
          <span className="badge badge-cit">ACT 1 — CIT</span>
          <h2>Subscription Active!</h2>
          <p className="act-subtitle">CIT complete — credentials stored for future recurring payments</p>
        </div>

        <div className="complete-card">
          <div className="complete-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>

          <div className="complete-details">
            <div className="complete-row">
              <span>Plan</span>
              <strong>Monthly Subscription — $9.99/mo</strong>
            </div>
            <div className="complete-row">
              <span>Transaction Type</span>
              <span className="badge badge-cit">CIT — FIRST_STORED</span>
            </div>
            <div className="complete-row">
              <span>3DS Authentication</span>
              <span className="badge badge-success">Authenticated</span>
            </div>
            <div className="complete-row">
              <span>Credential on File</span>
              <code>{state.storedToken || 'token_xxxxx'}</code>
            </div>
            <div className="complete-row">
              <span>Agreement ID</span>
              <code>{state.agreementId || 'AGREE-xxxxx'}</code>
            </div>
          </div>

          <div className="complete-next">
            <p>The agreement is now established. Proceed to Act 2 to see how the merchant charges automatically.</p>
            <button
              className="btn btn-secondary"
              onClick={() => dispatch({ type: 'SET_ACT', payload: 2 })}
            >
              Continue to Act 2: Recurring MIT →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
