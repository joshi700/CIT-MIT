import { useState } from 'react';
import { useSession } from '../../context/SessionContext';
import { processRecurring } from '../../utils/api';
import './Acts.css';

export default function Act2Recurring() {
  const { state, dispatch, addApiLogs } = useSession();
  const [step, setStep] = useState('intro'); // intro | processing | complete
  const [error, setError] = useState(null);
  const [transaction, setTransaction] = useState(null);

  const updateStep = (newStep) => {
    setStep(newStep);
    const stepMap = { intro: 0, processing: 1, complete: 2 };
    dispatch({ type: 'SET_STEP', payload: stepMap[newStep] || 0 });
  };

  const handleRecurring = async () => {
    try {
      setError(null);
      dispatch({ type: 'SET_LOADING', payload: true });
      updateStep('processing');

      const result = await processRecurring(state.demoSessionId);
      addApiLogs(result.apiLogs);
      dispatch({ type: 'ADD_TRANSACTION', payload: result.transaction });
      setTransaction(result.transaction);

      updateStep('complete');
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  if (step === 'intro') {
    return (
      <div className="act-content">
        <div className="act-header">
          <span className="badge badge-recurring">ACT 2 — MIT RECURRING</span>
          <h2>Automatic Monthly Billing</h2>
          <p className="act-subtitle">Merchant Initiated Transaction — cardholder is NOT present</p>
        </div>

        <div className="mit-card">
          <div className="mit-scenario">
            <div className="mit-scenario-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-mit-recurring)" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div>
              <h3>Scene: 30 Days Later</h3>
              <p>The billing cycle has elapsed. The merchant system automatically initiates a recurring charge of <strong>$9.99</strong> using the stored credential token.</p>
            </div>
          </div>

          <div className="mit-differences">
            <h4>Key Differences from Act 1 (CIT)</h4>
            <div className="mit-diff-grid">
              <div className="mit-diff-item">
                <div className="mit-diff-label">Cardholder Present</div>
                <div className="mit-diff-cit">
                  <span className="badge badge-cit">Act 1: YES</span>
                </div>
                <div className="mit-diff-mit">
                  <span className="badge badge-recurring">Act 2: NO</span>
                </div>
              </div>
              <div className="mit-diff-item">
                <div className="mit-diff-label">3DS Required</div>
                <div className="mit-diff-cit">
                  <span className="badge badge-cit">Act 1: YES</span>
                </div>
                <div className="mit-diff-mit">
                  <span className="badge badge-recurring">Act 2: NO</span>
                </div>
              </div>
              <div className="mit-diff-item">
                <div className="mit-diff-label">Credential on File</div>
                <div className="mit-diff-cit">
                  <code>FIRST_STORED</code>
                </div>
                <div className="mit-diff-mit">
                  <code>SUBSEQUENT</code>
                </div>
              </div>
              <div className="mit-diff-item">
                <div className="mit-diff-label">Initiator</div>
                <div className="mit-diff-cit">
                  <code>CARDHOLDER</code>
                </div>
                <div className="mit-diff-mit">
                  <code>MERCHANT</code>
                </div>
              </div>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button className="btn btn-recurring btn-lg" onClick={handleRecurring} disabled={state.loading}>
            {state.loading ? 'Processing...' : 'Simulate 30 Days Later — Charge $9.99'}
          </button>

          <div className="mit-token-ref">
            Using stored token: <code>{state.storedToken || 'token_xxxxx'}</code>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'processing') {
    return (
      <div className="act-content">
        <div className="act-header">
          <span className="badge badge-recurring">ACT 2 — MIT RECURRING</span>
          <h2>Processing Recurring Payment</h2>
          <p className="act-subtitle">No cardholder interaction, no 3DS challenge</p>
        </div>

        <div className="processing-card">
          <div className="processing-steps">
            <div className="processing-step active">
              <div className="spinner-small" />
              <div>
                <strong>MIT Pay (Recurring)</strong>
                <p>credentialOnFile: SUBSEQUENT, initiator: MERCHANT, reason: RECURRING</p>
              </div>
            </div>
          </div>
          <div className="processing-no-3ds">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
            No 3DS Challenge — Merchant initiated, cardholder not present
          </div>
        </div>
      </div>
    );
  }

  if (step === 'complete') {
    return (
      <div className="act-content">
        <div className="act-header">
          <span className="badge badge-recurring">ACT 2 — MIT RECURRING</span>
          <h2>Recurring Payment Complete</h2>
          <p className="act-subtitle">Monthly charge processed automatically</p>
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
              <span>Amount</span>
              <strong>${transaction?.amount?.toFixed(2) || '9.99'} USD</strong>
            </div>
            <div className="complete-row">
              <span>Transaction Type</span>
              <span className="badge badge-recurring">MIT — RECURRING</span>
            </div>
            <div className="complete-row">
              <span>3DS Authentication</span>
              <span className="text-muted">Not required (MIT)</span>
            </div>
            <div className="complete-row">
              <span>Credential on File</span>
              <code>SUBSEQUENT</code>
            </div>
            <div className="complete-row">
              <span>Status</span>
              <span className={`badge badge-${transaction?.status === 'SUCCESS' ? 'success' : 'failed'}`}>
                {transaction?.status || 'SUCCESS'}
              </span>
            </div>
          </div>

          <div className="complete-next">
            <p>The recurring charge was processed using the token from Act 1. Proceed to Act 3 for unscheduled charges.</p>
            <button
              className="btn btn-secondary"
              onClick={() => dispatch({ type: 'SET_ACT', payload: 3 })}
            >
              Continue to Act 3: Unscheduled MIT →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
